import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { uploadImage, getPresignedUrl } from '@/lib/r2';
import { randomUUID } from 'crypto';

const OCR_ENQUEUE_URL = process.env.OCR_ENQUEUE_URL!;

// POST /api/ocr/start
// Uploads image to R2, enqueues job in Modal Queue, returns jobId immediately.
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { image } = await request.json();
    if (!image) return Response.json({ error: 'image is required' }, { status: 400 });

    // Decode base64 → Buffer
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to R2
    const key = `plates/${Date.now()}-${randomUUID()}.jpg`;
    await uploadImage(buffer, key);

    // Presigned URL for Modal to download (5 min TTL)
    const imageUrl = await getPresignedUrl(key);
    const jobId = randomUUID();

    // Enqueue in Modal — fire and forget, returns immediately
    const res = await fetch(OCR_ENQUEUE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, image_url: imageUrl }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Modal enqueue error:', err);
      return Response.json({ error: 'Failed to enqueue OCR job' }, { status: 502 });
    }

    return Response.json({ jobId, imageKey: key });
  } catch (error) {
    console.error('OCR start error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
