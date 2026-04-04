"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,#e9d5ff_0%,transparent_35%),radial-gradient(circle_at_85%_10%,#bbf7d0_0%,transparent_32%),linear-gradient(160deg,#f8fafc,#fff7ed)] px-6 py-16">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/60 bg-white/70 p-10 shadow-xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">SkillSync AI</p>
        <h1 className="mt-4 text-5xl font-bold leading-tight text-slate-900">Internship Readiness + Smart Apply Assistant</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-700">
          Upload your resume, compare it against internships, detect skill gaps, simulate future progress, and apply smarter with the Chrome extension.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700">Create Account</Link>
          <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100">Login</Link>
        </div>
      </div>
    </div>
  );
}
