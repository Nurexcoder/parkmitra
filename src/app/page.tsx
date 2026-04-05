import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-[#0c0c0c] text-white min-h-screen font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 border-b border-white/8 sticky top-0 bg-[#0c0c0c]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">P</div>
          <span className="font-semibold text-base sm:text-lg tracking-tight">ParkMitra</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <a
            href="https://github.com/Nurexcoder/parkmitra"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <GithubIcon />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link
            href="/login"
            className="text-sm bg-white text-black px-3 sm:px-4 py-1.5 rounded-md font-medium hover:bg-zinc-100 transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 md:px-12 pt-16 sm:pt-24 pb-10 sm:pb-12 max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Open source · MIT License
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-5 sm:mb-7">
            Parking lots<br />
            <span className="text-zinc-500">deserve better</span><br />
            software.
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
            ParkMitra replaces paper tokens and manual logbooks with QR codes, automatic
            fee calculation, plate OCR, and UPI payments — built for ground-level operators.
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="bg-violet-600 hover:bg-violet-500 text-white px-5 sm:px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              Open Dashboard
            </Link>
            <a
              href="https://github.com/Nurexcoder/parkmitra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              View source <span className="text-zinc-600">→</span>
            </a>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="rounded-xl border border-white/8 overflow-hidden shadow-2xl shadow-black/60">
          <div className="bg-[#161616] border-b border-white/8 flex items-center gap-2 px-4 py-3">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="ml-3 text-xs text-zinc-600 font-mono">parkmitra / dashboard</span>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* Problem strip */}
      <section className="px-4 sm:px-6 md:px-12 py-12 sm:py-16 border-y border-white/8 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-px bg-white/8 rounded-xl overflow-hidden">
          {[
            { label: "The old way", text: "Paper token handed out at entry. Half the time it's wet, lost, or the handwriting is unreadable. Fee is guessed at exit." },
            { label: "The gap", text: "Spreadsheets and ledgers can't tell you how many vehicles are inside right now, or what yesterday's revenue was." },
            { label: "What changed", text: "Each rider gets a QR code. Scan in, scan out. Duration is tracked. Fee is calculated. UPI or cash — operator's choice." },
          ].map(({ label, text }) => (
            <div key={label} className="bg-[#0c0c0c] px-6 sm:px-8 py-8 sm:py-10">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 font-medium">{label}</p>
              <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature: QR flow */}
      <section className="px-4 sm:px-6 md:px-12 py-16 sm:py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">How entry works</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 leading-snug">Scan in. Scan out.<br />That's the whole job.</h2>
          <p className="text-zinc-400 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
            Register a rider once — name, vehicle number, plate photo. ParkMitra generates their QR code and emails it automatically.
            From that point, entry and exit is a single camera scan.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Works on any device with a camera. No dedicated hardware needed.
            The operator opens a browser, points the camera, done.
          </p>
        </div>
        <QRFlowIllustration />
      </section>

      {/* Feature: Plate OCR */}
      <section className="px-4 sm:px-6 md:px-12 py-16 sm:py-24 border-t border-white/8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
          <OCRIllustration />
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">License plate OCR</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 leading-snug">Camera reads the plate.<br />You do nothing.</h2>
            <p className="text-zinc-400 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
              Snap a photo of the number plate during registration. EasyOCR running on Modal serverless
              reads the text and auto-fills the vehicle number in seconds — no typing required.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: "⚡", text: "Serverless OCR — zero infra to manage" },
                { icon: "📷", text: "Works with any smartphone or webcam" },
                { icon: "✏️", text: "Always editable — correct mistakes instantly" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="text-base">{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature: Payments */}
      <section className="px-4 sm:px-6 md:px-12 py-16 sm:py-24 border-t border-white/8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">Payments</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 leading-snug">Cash or UPI —<br />rider's choice.</h2>
            <p className="text-zinc-400 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
              At exit, the operator picks cash or UPI. UPI generates a Razorpay QR instantly — rider scans,
              pays, and the system confirms automatically. No manual entry, no change disputes.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: "🔒", text: "Powered by Razorpay — trusted by millions" },
                { icon: "⚡", text: "Auto-confirms payment, no refresh needed" },
                { icon: "📊", text: "Revenue tracked in real time on dashboard" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="text-base">{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>
          <PaymentIllustration />
        </div>
      </section>

      {/* Feature: Dashboard */}
      <section className="px-4 sm:px-6 md:px-12 py-16 sm:py-24 border-t border-white/8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
          <StatsIllustration />
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">Live visibility</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 leading-snug">Know what's happening<br />without asking anyone.</h2>
            <p className="text-zinc-400 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
              The dashboard shows currently parked vehicles, today's revenue, and a log of every
              entry and exit. Refreshes in real time — no manual tallying at end of day.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Multi-admin support means every shift can have their own login
              without sharing credentials.
            </p>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-t border-white/8 px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-6">Stack</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { name: "Next.js 15", desc: "App Router + API routes" },
              { name: "MongoDB", desc: "Sessions & rider data" },
              { name: "Modal.com", desc: "Serverless EasyOCR" },
              { name: "Cloudflare R2", desc: "Plate image storage" },
              { name: "Razorpay", desc: "UPI & card payments" },
              { name: "Resend", desc: "QR code emails" },
              { name: "JWT + bcrypt", desc: "Auth & security" },
              { name: "Tailwind CSS", desc: "UI styling" },
            ].map(({ name, desc }) => (
              <div key={name} className="bg-[#111] border border-white/8 rounded-lg px-4 py-3">
                <p className="text-zinc-200 text-sm font-medium mb-0.5">{name}</p>
                <p className="text-zinc-600 text-xs">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-sm mt-6">
            Self-hosted. No vendor lock-in. One <code className="text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">.env.local</code> file and you're running.
          </p>
        </div>
      </section>

      {/* Contribute */}
      <section className="px-4 sm:px-6 md:px-12 py-16 sm:py-24 max-w-7xl mx-auto">
        <div className="border border-white/8 rounded-2xl p-6 sm:p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 justify-between bg-[#111111]">
          <div className="max-w-xl">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Built in the open.</h2>
            <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">
              ParkMitra started as a solution to a real problem at a busy parking lot.
              The code is on GitHub — if you've run into the same problems, or want to shape
              where it goes next, contributions are very welcome.
            </p>
          </div>
          <a
            href="https://github.com/Nurexcoder/parkmitra"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2.5 bg-white text-black px-5 sm:px-6 py-3 rounded-lg font-medium hover:bg-zinc-100 transition-colors text-sm whitespace-nowrap"
          >
            <GithubIcon className="text-black" />
            Contribute on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-4 sm:px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
        <span>ParkMitra — MIT License</span>
        <a
          href="https://github.com/Nurexcoder/parkmitra"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-400 transition-colors"
        >
          github.com/Nurexcoder/parkmitra
        </a>
      </footer>

    </div>
  );
}

/* ── Inline SVG / illustration components ── */

function GithubIcon({ className = "text-zinc-400" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function DashboardMockup() {
  return (
    <div className="bg-[#111] overflow-hidden">
      <div className="flex" style={{ minHeight: 300 }}>
        <div className="hidden sm:flex w-36 md:w-44 bg-[#0e0e0e] border-r border-white/8 flex-col gap-1 p-3 shrink-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-5 h-5 bg-violet-500 rounded flex items-center justify-center text-[10px] font-bold shrink-0">P</div>
            <span className="text-xs font-semibold text-zinc-300">ParkMitra</span>
          </div>
          {["Dashboard", "Entry", "Exit", "Riders", "Admins"].map((item, i) => (
            <div key={item} className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 ${i === 0 ? "bg-white/8 text-white" : "text-zinc-500"}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? "bg-violet-400" : "bg-zinc-700"}`} />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
          <p className="text-[10px] sm:text-xs text-zinc-500 mb-3 sm:mb-4 font-medium">Dashboard — Today</p>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-5">
            {[
              { label: "Parked", value: "12", color: "text-violet-400" },
              { label: "Entry", value: "47", color: "text-emerald-400" },
              { label: "Revenue", value: "₹2,340", color: "text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#1a1a1a] rounded-lg p-2 sm:p-3 md:p-4 border border-white/6">
                <p className="text-zinc-500 text-[9px] sm:text-[10px] md:text-xs mb-1 sm:mb-2 truncate">{label}</p>
                <p className={`text-base sm:text-lg md:text-2xl font-bold ${color} truncate`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#1a1a1a] rounded-lg border border-white/6 overflow-hidden">
            <div className="flex text-[9px] sm:text-xs text-zinc-500 px-2 sm:px-4 py-2 border-b border-white/6 font-medium uppercase tracking-wider">
              <span className="flex-1 min-w-0">Vehicle</span>
              <span className="w-12 sm:w-16 shrink-0">Entry</span>
              <span className="w-12 sm:w-16 shrink-0 hidden sm:block">Duration</span>
              <span className="w-12 sm:w-16 shrink-0">Status</span>
            </div>
            {[
              { v: "WB02AB1234", t: "09:14", d: "4h 32m", s: "Parked" },
              { v: "MH01CD5678", t: "10:02", d: "3h 44m", s: "Parked" },
              { v: "DL06EF9012", t: "11:30", d: "—",      s: "Exited" },
              { v: "KA04GH3456", t: "12:15", d: "1h 41m", s: "Parked" },
            ].map((row) => (
              <div key={row.v} className="flex text-[9px] sm:text-xs px-2 sm:px-4 py-2 border-b border-white/4 last:border-0 text-zinc-400 items-center">
                <span className="flex-1 min-w-0 text-zinc-200 font-mono truncate pr-2">{row.v}</span>
                <span className="w-12 sm:w-16 shrink-0">{row.t}</span>
                <span className="w-12 sm:w-16 shrink-0 hidden sm:block">{row.d}</span>
                <span className={`w-12 sm:w-16 shrink-0 ${row.s === "Parked" ? "text-emerald-400" : "text-zinc-600"}`}>{row.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QRFlowIllustration() {
  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative w-48 sm:w-52 mx-auto">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-3 shadow-2xl shadow-black/50">
          <div className="bg-[#111] rounded-2xl overflow-hidden">
            <div className="bg-black h-44 sm:h-52 relative flex items-center justify-center rounded-xl m-1">
              <div className="absolute inset-4 border-2 border-violet-400/40 rounded-lg" />
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-violet-400 rounded-tl" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-violet-400 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-violet-400 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-violet-400 rounded-br" />
              <QRCodeGrid />
              <div className="absolute left-6 right-6 h-0.5 bg-violet-400/60 top-1/2 shadow-lg shadow-violet-400/40" />
            </div>
            <div className="px-3 py-2 text-center">
              <p className="text-zinc-400 text-xs">Scanning for QR code…</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-48 sm:w-52 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs text-emerald-400 font-medium">Entry Recorded</span>
        </div>
        <p className="text-white text-sm font-semibold font-mono">WB02AB1234</p>
        <p className="text-zinc-500 text-xs mt-0.5">Rahul Sharma · 09:14 AM</p>
      </div>
    </div>
  );
}

function OCRIllustration() {
  return (
    <div className="flex flex-col gap-3 max-w-xs mx-auto w-full">
      {/* Camera capture mockup */}
      <div className="bg-black rounded-xl overflow-hidden aspect-video relative border border-white/8">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-800" />
        {/* Plate region */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded px-4 py-2 shadow-lg">
            <span className="font-mono font-bold text-black text-lg tracking-widest">MH 12 AB 3456</span>
          </div>
        </div>
        {/* Corner markers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[82%] h-[42%]">
            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-violet-400 rounded-tl" />
            <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-violet-400 rounded-tr" />
            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-violet-400 rounded-bl" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-violet-400 rounded-br" />
          </div>
        </div>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span className="bg-black/60 text-violet-300 text-[10px] px-2 py-0.5 rounded">Align plate here</span>
        </div>
      </div>

      {/* Processing step */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
          <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin block" />
        </div>
        <div>
          <p className="text-xs text-zinc-400">EasyOCR · Modal serverless</p>
          <p className="text-[10px] text-zinc-600">Reading plate…</p>
        </div>
      </div>

      {/* Result */}
      <div className="bg-[#1a1a1a] border border-emerald-500/25 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-500 mb-0.5">Detected plate</p>
          <p className="text-emerald-400 font-mono font-bold tracking-widest">MH12AB3456</p>
        </div>
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

function PaymentIllustration() {
  return (
    <div className="flex flex-col gap-3 max-w-xs mx-auto w-full">
      <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
        <p className="text-xs text-zinc-500 mb-3">Parking fee</p>
        <p className="text-3xl font-bold text-white mb-4">₹60</p>
        <div className="flex gap-2 mb-5">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-center text-xs text-zinc-400">
            Cash
          </div>
          <div className="flex-1 bg-violet-600/20 border border-violet-500/40 rounded-lg px-3 py-2.5 text-center text-xs text-violet-300 font-medium">
            UPI
          </div>
        </div>
        {/* QR placeholder */}
        <div className="bg-white rounded-lg p-3 flex items-center justify-center mb-3">
          <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(7, 1fr)", width: 56, height: 56 }}>
            {[1,1,1,0,1,1,1,1,0,1,0,1,0,1,1,1,1,0,1,1,1,0,0,0,0,0,0,0,1,0,1,1,1,0,1,0,0,0,1,0,0,0,1,1,1,0,1,0,1].map((c, i) => (
              <div key={i} className={`rounded-sm ${c ? "bg-black" : "bg-transparent"}`} />
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] text-zinc-500">Scan with any UPI app</p>
      </div>
      <div className="bg-[#1a1a1a] border border-emerald-500/25 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-emerald-400 font-medium">Payment confirmed</p>
          <p className="text-[10px] text-zinc-500">Auto-detected · no refresh needed</p>
        </div>
      </div>
    </div>
  );
}

function QRCodeGrid() {
  const pattern = [
    [1,1,1,0,1,0,1,1,1],
    [1,0,1,0,0,0,1,0,1],
    [1,0,1,1,0,1,1,0,1],
    [0,0,0,1,1,0,0,0,0],
    [1,0,1,0,1,0,1,0,1],
    [0,0,0,1,0,1,0,0,0],
    [1,1,1,0,1,0,1,1,1],
    [1,0,1,0,0,1,0,1,0],
    [1,1,1,1,0,0,1,0,1],
  ];
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(9, 1fr)", width: 72, height: 72 }}>
      {pattern.flat().map((cell, i) => (
        <div key={i} className={`rounded-sm ${cell ? "bg-white" : "bg-transparent"}`} />
      ))}
    </div>
  );
}

function StatsIllustration() {
  const bars = [40, 65, 50, 80, 60, 90, 55, 75, 45, 85, 70, 95];
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Revenue — Last 12 days</p>
          <p className="text-xl sm:text-2xl font-bold text-white">₹28,450</p>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full font-medium">+18.4%</span>
      </div>
      <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-28 mb-4 sm:mb-5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div className={`rounded-sm ${i === bars.length - 1 ? "bg-violet-500" : "bg-white/10"}`} style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-4">
        {[
          { label: "Avg. daily revenue", val: "₹2,371" },
          { label: "Peak occupancy", val: "34 vehicles" },
          { label: "Avg. duration", val: "2h 18m" },
          { label: "Total sessions", val: "312" },
        ].map(({ label, val }) => (
          <div key={label}>
            <p className="text-zinc-600 text-xs mb-0.5">{label}</p>
            <p className="text-zinc-200 text-sm font-semibold">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
