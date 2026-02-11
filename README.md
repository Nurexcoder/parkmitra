# ParkMitra - Setup & Quick Start Guide

## 📋 Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create/edit `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/parkmitra
JWT_SECRET=your-secret-key-here
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Get free Resend API key at [resend.com](https://resend.com)

### 3. Seed Database
```bash
npm run seed
```

Creates admin: `admin@parkmitra.com` / `admin123`

### 4. Start Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 First Steps

1. **Login** at `/login` with admin credentials
2. **Add Rider** at Riders → Add New Rider
3. **Check Email** for QR code
4. **Scan Entry** at Entry page
5. **Scan Exit** at Exit page
6. **View Dashboard** for stats

## 📱 Features

- ✅ Admin authentication (JWT)
- ✅ Rider management with QR codes
- ✅ Email QR delivery
- ✅ Camera-based QR scanning
- ✅ Entry/exit tracking
- ✅ Automated payment (₹20/₹30)
- ✅ Real-time dashboard
- ✅ Activity logs

## 🎨 Tech Stack

Next.js 16 • TypeScript • MongoDB • Tailwind CSS • JWT • Resend

---

**Need help?** Check the walkthrough documentation for detailed information.
