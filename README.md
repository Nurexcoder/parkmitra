# ParkMitra

QR-based parking management system. Replaces paper tokens and manual logbooks with QR codes, automatic fee calculation, license plate OCR, and UPI payments.

**Live demo:** [parkmitra.mugiwara.dev](https://parkmitra.mugiwara.dev)

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [OCR Service (Modal)](#ocr-service-modal)
- [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| QR-based entry/exit | Scan a rider's QR code at gate — session starts/ends instantly |
| Plate OCR | Camera captures number plate → EasyOCR reads it → auto-fills the form |
| UPI payments | Razorpay QR at exit — rider pays on phone, system auto-confirms |
| Cash payments | Mark as cash, session closes immediately |
| Rider management | Register riders with name, phone, email, vehicle number, plate photo |
| Real-time dashboard | Live count of parked vehicles, today's revenue, session logs |
| Multi-admin | Each shift gets their own login — no shared credentials |
| Email delivery | QR code emailed to rider automatically on registration |

---

## How It Works

```
Register rider → get QR code (emailed)
       ↓
Entry: scan QR or enter plate → session starts, entry time logged
       ↓
Exit:  scan QR or enter plate → fee calculated (duration × rate)
       ↓
Pay:   Cash (instant) or UPI (Razorpay QR → auto-confirm on payment)
       ↓
Session closed → appears in dashboard logs
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | MongoDB / Mongoose |
| Auth | JWT + bcrypt |
| Styling | Tailwind CSS |
| OCR service | EasyOCR on [Modal.com](https://modal.com) (serverless Python) |
| Image storage | Cloudflare R2 (S3-compatible) |
| Payments | Razorpay (UPI, cards, netbanking) |
| Email | Resend |
| QR codes | `qrcode` npm package + `@zxing/library` for scanning |

---

## Project Structure

```
parkmitra/
├── src/
│   ├── app/
│   │   ├── page.tsx                         # Landing page
│   │   ├── login/page.tsx                   # Admin login
│   │   ├── (dashboard)/                     # Protected dashboard routes
│   │   │   ├── layout.tsx                   # Sidebar + auth guard
│   │   │   ├── dashboard/page.tsx           # Stats + session log
│   │   │   ├── entry/page.tsx               # QR scan or plate entry
│   │   │   ├── exit/page.tsx                # QR scan or plate exit + payment
│   │   │   ├── riders/
│   │   │   │   ├── page.tsx                 # Rider list + search
│   │   │   │   ├── new/page.tsx             # Add rider form
│   │   │   │   └── edit/[id]/page.tsx       # Edit rider
│   │   │   └── settings/
│   │   │       ├── admins/page.tsx          # Admin management
│   │   │       └── password/page.tsx        # Change password
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts           # POST — issue JWT
│   │       │   ├── admins/route.ts          # GET/POST — manage admins
│   │       │   └── change-password/route.ts
│   │       ├── riders/
│   │       │   ├── route.ts                 # GET list / POST create
│   │       │   └── [id]/route.ts            # GET / PUT / DELETE single rider
│   │       ├── entry/
│   │       │   ├── route.ts                 # POST — start session by QR
│   │       │   └── plate/route.ts           # POST — start session by plate number
│   │       ├── exit/
│   │       │   ├── route.ts                 # POST — look up active session
│   │       │   ├── confirm/route.ts         # POST — close session + record payment
│   │       │   └── plate/route.ts           # POST — look up session by plate number
│   │       ├── ocr/
│   │       │   ├── start/route.ts           # POST — upload to R2, enqueue Modal job
│   │       │   └── status/[jobId]/route.ts  # GET — proxy Modal result
│   │       ├── payment/
│   │       │   ├── create-link/route.ts     # POST — create Razorpay payment link
│   │       │   └── status/[linkId]/route.ts # GET — poll Razorpay payment status
│   │       └── dashboard/
│   │           ├── stats/route.ts           # GET — live counts + revenue
│   │           └── logs/route.ts            # GET — paginated session log
│   ├── components/
│   │   ├── QRScanner.tsx                    # Webcam QR scanner (ZXing)
│   │   ├── PlateScanner.tsx                 # Webcam capture → OCR polling
│   │   ├── RiderForm.tsx                    # Add/edit rider with inline camera
│   │   ├── DashboardStats.tsx               # Stat cards component
│   │   └── SessionsTable.tsx                # Session log table
│   ├── lib/
│   │   ├── auth.ts                          # JWT sign/verify + withAuth middleware
│   │   ├── db.ts                            # Mongoose connection helper
│   │   ├── email.ts                         # Resend email templates
│   │   ├── qr.ts                            # QR code generation
│   │   ├── r2.ts                            # R2 upload / presign / public URL
│   │   └── razorpay.ts                      # Razorpay singleton
│   └── models/
│       ├── Admin.ts                         # Admin schema
│       ├── Rider.ts                         # Rider schema (includes image_key)
│       └── ParkingSession.ts                # Session schema (entry/exit/fee/payment)
├── services/
│   └── ocr/
│       └── modal_app.py                     # Serverless EasyOCR (Modal + FastAPI)
├── scripts/
│   └── seed.js                              # Creates first admin account
└── .env.local                               # Environment variables (see below)
```

---

## Architecture

### Overall system

```mermaid
graph TD
    Browser["Browser / Mobile"]
    NextJS["Next.js App\n(API + UI)"]
    MongoDB["MongoDB Atlas"]
    R2["Cloudflare R2\n(plate images)"]
    Modal["Modal.com\n(EasyOCR serverless)"]
    Razorpay["Razorpay\n(UPI payments)"]
    Resend["Resend\n(email)"]

    Browser -->|HTTPS| NextJS
    NextJS -->|Mongoose| MongoDB
    NextJS -->|S3 API| R2
    NextJS -->|HTTP enqueue| Modal
    Modal -->|presigned GET| R2
    NextJS -->|REST API| Razorpay
    NextJS -->|API| Resend
```

### Entry / exit flow

```mermaid
flowchart LR
    A[Rider arrives] --> B{Scan method}
    B -->|QR code| C[POST /api/entry]
    B -->|Plate number| D[POST /api/entry/plate]
    C & D --> E[Create ParkingSession\nentry_time = now]

    F[Rider exits] --> G{Scan method}
    G -->|QR code| H[POST /api/exit]
    G -->|Plate number| I[POST /api/exit/plate]
    H & I --> J[Calculate fee\nduration x rate]
    J --> K{Payment}
    K -->|Cash| L[POST /api/exit/confirm\npayment_method=cash]
    K -->|UPI| M[Create Razorpay link\nPoll for payment]
    M --> N[Auto-confirm on paid]
    L & N --> O[Session closed]
```

### Plate OCR flow

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js API
    participant R2 as Cloudflare R2
    participant Modal as Modal EasyOCR

    Browser->>NextJS: POST /api/ocr/start (base64 image)
    NextJS->>R2: Upload image, get object key
    NextJS->>R2: Generate presigned URL (5 min TTL)
    NextJS->>Modal: POST /enqueue { job_id, image_url }
    NextJS-->>Browser: { jobId, imageKey }

    loop Poll every 2s (max 60s)
        Browser->>NextJS: GET /api/ocr/status/:jobId
        NextJS->>Modal: GET /status?job_id=...
        Modal-->>NextJS: pending / done / failed
        NextJS-->>Browser: status + plate text
    end

    Browser->>Browser: Auto-fill vehicle number field
```

### UPI payment flow

```mermaid
sequenceDiagram
    participant Admin as Admin browser
    participant NextJS as Next.js API
    participant Razorpay

    Admin->>NextJS: POST /api/payment/create-link { amount }
    NextJS->>Razorpay: Create payment link
    Razorpay-->>NextJS: { id, qr_url }
    NextJS-->>Admin: Show QR to rider

    loop Poll every 3s
        Admin->>NextJS: GET /api/payment/status/:linkId
        NextJS->>Razorpay: Fetch payment link status
        Razorpay-->>NextJS: created / paid
        NextJS-->>Admin: status
    end

    Admin->>NextJS: POST /api/exit/confirm
    NextJS->>NextJS: Close session, record payment
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/cloud/atlas))
- [Resend](https://resend.com) account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/Nurexcoder/parkmitra
cd parkmitra
npm install
```

### 2. Configure environment

Create `.env.local` in the project root. See [Environment Variables](#environment-variables) for all keys.

The minimum to get started locally:

```env
MONGODB_URI=mongodb://localhost:27017/parkmitra
JWT_SECRET=any-random-string
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed the database

Creates the first admin: `admin@parkmitra.com` / `admin123`

```bash
npm run seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. First login

1. Go to `/login` → `admin@parkmitra.com` / `admin123`
2. Change your password at **Settings → Change Password**
3. Add a rider at **Riders → Add New Rider**
4. Check email for the QR code
5. Use **Entry** and **Exit** pages to test a full session

---

## Environment Variables

```env
# ── Required ───────────────────────────────────────────────────────────────────

# MongoDB connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster

# JWT signing secret — use a long random string in production
JWT_SECRET=change-me-in-production

# Resend API key — https://resend.com (free tier)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Public URL of this app (used in email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Payments (Razorpay) ────────────────────────────────────────────────────────
# https://dashboard.razorpay.com → Settings → API Keys
# Use test keys (rzp_test_...) during development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx

# ── Plate image storage (Cloudflare R2) ────────────────────────────────────────
# Create a bucket at https://dash.cloudflare.com → R2
# Enable public access on the bucket to get NEXT_PUBLIC_R2_URL
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=parkmitra
NEXT_PUBLIC_R2_URL=https://pub-xxxxxxxxxxxx.r2.dev

# ── OCR service (Modal.com) ────────────────────────────────────────────────────
# Run: modal deploy services/ocr/modal_app.py
# Then copy the two printed endpoint URLs here
OCR_ENQUEUE_URL=https://your-username--parkmitra-ocr-gateway-enqueue.modal.run
OCR_STATUS_URL=https://your-username--parkmitra-ocr-gateway-status.modal.run
```

> Plate OCR (Modal + R2) and UPI payments (Razorpay) are optional. The app runs without them — skip those vars and those features are simply unavailable.

---

## OCR Service (Modal)

The plate OCR runs as a serverless Python microservice on [Modal.com](https://modal.com). Skip this section if you don't need automatic plate detection.

### What it does

1. Browser captures a frame and sends it to `/api/ocr/start`
2. Next.js uploads the image to R2, generates a presigned URL, and posts a job to Modal
3. Modal picks the job from a queue, downloads the image via the presigned URL, runs EasyOCR, and writes the result to a Modal Dict
4. Browser polls `/api/ocr/status/:jobId` every 2 seconds until it gets a result

### Deploy

```bash
pip install modal
modal setup                                    # authenticate once
modal deploy services/ocr/modal_app.py        # deploy to production
```

Copy the two printed URLs into `.env.local` as `OCR_ENQUEUE_URL` and `OCR_STATUS_URL`.

### Local testing

```bash
modal serve services/ocr/modal_app.py
```

Prints `-dev` suffixed URLs. Use these in `.env.local` while iterating, switch to `modal deploy` URLs for production.

---

## Contributing

### Good first issues

- Rate configuration UI — fee rates are currently hardcoded in the exit confirm route
- Bulk CSV import of riders
- PDF receipt generation at exit
- Session history page for individual riders
- Webhook support for Razorpay instead of polling

### Workflow

```bash
# 1. Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/parkmitra
cd parkmitra

# 2. Create a branch
git checkout -b feat/your-feature-name

# 3. Install and run
npm install
npm run dev

# 4. Make your changes, push, and open a PR against main
```

### Conventions

**API routes** — live in `src/app/api/`. Wrap every handler with `withAuth` from `src/lib/auth.ts`. Call `connectDB()` before any Mongoose operation. Always return `Response.json(...)` and handle errors — never let routes throw.

**Models** — in `src/models/`. Use the singleton pattern at the bottom of each file (`mongoose.models.X || mongoose.model('X', schema)`).

**Components** — all `'use client'`, Tailwind only. Keep the dark theme consistent: `bg-[#0c0c0c]` base, `bg-[#1a1a1a]` cards, violet-600 accent.

**New page** — create under `src/app/(dashboard)/your-page/page.tsx`. The layout handles auth and sidebar automatically. Add a nav link in `src/app/(dashboard)/layout.tsx` if needed.

**New lib utility** — goes in `src/lib/`. Keep it stateless; side effects belong in API routes.

---

## License

MIT
