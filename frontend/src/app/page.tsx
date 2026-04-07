"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(55,65,210,0.16),transparent_38%),radial-gradient(circle_at_80%_8%,rgba(56,189,248,0.14),transparent_34%),linear-gradient(180deg,#050816,#0a1022)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-700/60 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8 md:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300 sm:text-xs">SkillSync AI</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-100 sm:mt-4 sm:text-4xl md:text-5xl">Internship Readiness + Smart Apply Assistant</h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base md:text-lg">
          Upload your resume, compare it against internships, detect skill gaps, simulate future progress, and apply smarter with the Chrome extension.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:max-w-md">
          <Link
            href="/signup"
            className="rounded-xl border border-sky-300/35 bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:brightness-110 sm:text-base"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-600 bg-slate-900/90 px-5 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-slate-800 sm:text-base"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
