"""
ParkMitra OCR — Modal.com serverless deployment
EasyOCR on preprocessed full image.
(YOLO plate detection can be added later once a reliable model source is confirmed)

Deploy:
    pip install modal
    modal setup
    modal deploy services/ocr/modal_app.py

After deploy, copy the two printed endpoint URLs into .env.local:
    OCR_ENQUEUE_URL=https://...-gateway-enqueue.modal.run
    OCR_STATUS_URL=https://...-gateway-status.modal.run
"""

import re

import modal

# ── Images ────────────────────────────────────────────────────────────────────

gateway_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]")
)

ocr_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install([
        "libgl1", "libglib2.0-0", "libsm6",
        "libxext6", "libxrender-dev", "libgomp1",
    ])
    .pip_install([
        "fastapi[standard]",
        "easyocr==1.7.1",
        "opencv-python-headless==4.10.0.84",
        "Pillow==10.4.0",
        "numpy==1.26.4",
        "httpx==0.27.0",
    ])
)

app = modal.App("parkmitra-ocr")

# ── Persistent storage ────────────────────────────────────────────────────────

ocr_queue   = modal.Queue.from_name("parkmitra-ocr-queue",   create_if_missing=True)
ocr_results = modal.Dict.from_name("parkmitra-ocr-results",  create_if_missing=True)
model_vol   = modal.Volume.from_name("parkmitra-ocr-models", create_if_missing=True)

MODEL_DIR   = "/models"
EASYOCR_DIR = f"{MODEL_DIR}/easyocr"

PLATE_PATTERN = re.compile(
    r'([A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4}'
    r'|\d{2}[\s\-]?BH[\s\-]?\d{4}[\s\-]?[A-Z]{1,2})',
    re.IGNORECASE,
)


# ── Worker (defined first so Gateway can reference it) ────────────────────────

@app.function(
    image=ocr_image,
    memory=2048,
    timeout=120,
    volumes={MODEL_DIR: model_vol},
)
def process_job():
    """
    Picks one job from the queue, runs EasyOCR, writes result to Dict.
    Spawned by Gateway.enqueue on every new job.
    """
    import os
    import httpx
    import cv2
    import numpy as np
    import easyocr

    # Redirect EasyOCR model cache to the persistent volume
    os.makedirs(EASYOCR_DIR, exist_ok=True)
    os.environ["EASYOCR_MODULE_PATH"] = EASYOCR_DIR

    reader = easyocr.Reader(['en'], gpu=False, verbose=False)

    # Get one job (wait up to 30s)
    item = ocr_queue.get(timeout=30)
    if item is None:
        return

    job_id: str    = item["job_id"]
    image_url: str = item["image_url"]

    try:
        # Download image from R2 presigned URL
        resp = httpx.get(image_url, timeout=15)
        resp.raise_for_status()

        arr = np.frombuffer(resp.content, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")

        # Preprocess: grayscale + CLAHE contrast enhancement
        gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        denoised = cv2.fastNlMeansDenoising(enhanced, h=10)

        result = _run_ocr(denoised, reader)

        if result["plate"]:
            ocr_results[job_id] = {"status": "done", **result}
        else:
            ocr_results[job_id] = {
                "status": "failed",
                "error": f"No plate detected. Raw OCR: '{result['raw']}'",
            }

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        ocr_results[job_id] = {"status": "failed", "error": str(e)}


# ── Gateway — lightweight HTTP endpoints ──────────────────────────────────────

@app.cls(image=gateway_image)
class Gateway:

    @modal.fastapi_endpoint(method="POST")
    def enqueue(self, body: dict) -> dict:
        job_id: str    = body.get("job_id", "")
        image_url: str = body.get("image_url", "")

        if not job_id or not image_url:
            return {"error": "job_id and image_url are required"}

        ocr_results[job_id] = {"status": "pending"}
        ocr_queue.put({"job_id": job_id, "image_url": image_url})
        process_job.spawn()

        return {"queued": True, "job_id": job_id}

    @modal.fastapi_endpoint(method="GET")
    def status(self, job_id: str) -> dict:
        return ocr_results.get(job_id) or {"status": "not_found"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _run_ocr(image, reader) -> dict:
    results = reader.readtext(
        image,
        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        detail=1,
        paragraph=False,
    )
    candidates = [(t.strip().upper(), float(c)) for _, t, c in results if t.strip()]

    # Single block match
    for text, conf in candidates:
        m = PLATE_PATTERN.search(text)
        if m:
            return {"plate": _norm(m.group(0)), "confidence": round(conf, 3), "raw": text}

    # Concatenated match (handles split reads like "MH01" + "AB1234")
    joined = ' '.join(t for t, _ in candidates)
    m = PLATE_PATTERN.search(joined)
    if m:
        avg = sum(c for _, c in candidates) / len(candidates) if candidates else 0.0
        return {"plate": _norm(m.group(0)), "confidence": round(avg, 3), "raw": joined}

    return {"plate": None, "confidence": 0.0, "raw": joined}


def _norm(text: str) -> str:
    return re.sub(r'[\s\-]', '', text).upper()
