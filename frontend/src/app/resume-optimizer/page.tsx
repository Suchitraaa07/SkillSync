"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { api } from "@/lib/api";

type ResumeInsights = {
  summary: string;
  lacking: string[];
  improvements: string[];
  optimizedResumeMarkdown: string;
  source?: "openai" | "fallback";
};

export default function ResumeOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [insights, setInsights] = useState<ResumeInsights | null>(null);

  const excerpt = useMemo(() => {
    if (!result) return "";
    return result.length > 1500 ? `${result.slice(0, 1500)}...` : result;
  }, [result]);

  const sortedLacking = useMemo(
    () => (insights?.lacking ? [...insights.lacking].sort((a, b) => a.localeCompare(b)) : []),
    [insights]
  );
  const sortedImprovements = useMemo(
    () => (insights?.improvements ? [...insights.improvements].sort((a, b) => a.localeCompare(b)) : []),
    [insights]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setStatus("");
    setInsights(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a PDF resume first.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("Uploading and extracting text...");
      setResult("");

      const formData = new FormData();
      formData.append("resume", file);

      const response = await api.post<{ text: string; insights?: ResumeInsights }>("/pdf/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extractedText = response.data?.text || "";
      setInsights(response.data?.insights || null);
      if (!extractedText.trim()) {
        setStatus("Upload completed, but no readable text was found in this PDF.");
      } else {
        setStatus("Resume uploaded successfully. Text extracted below.");
      }
      setResult(extractedText);
    } catch (error: any) {
      setStatus(error?.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <section className="grid gap-4 xl:grid-cols-[minmax(320px,430px)_1fr]">
          <div className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.95))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Resume Analyzer</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Upload and validate your PDF</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              We use `pdfplumber` for extraction and fallback parsing for better reliability.
            </p>

            <label className="mt-5 block rounded-xl border border-dashed border-slate-600 bg-slate-900/70 px-3 py-6 text-center text-sm text-slate-300">
              <span className="font-medium text-slate-100">Choose a resume PDF</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="mt-3 w-full cursor-pointer text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:font-medium file:text-cyan-100 hover:file:bg-cyan-500/30" />
            </label>

            {file ? (
              <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                Selected file: <span className="font-medium text-slate-100">{file.name}</span>
              </p>
            ) : null}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-4 w-full rounded-xl border border-cyan-400/35 bg-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Upload Resume"}
            </button>

            {status ? (
              <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200">
                {status}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.95))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">Extracted Resume Text</h3>
              <span className="rounded-full border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-300">
                {result ? `${result.length.toLocaleString()} chars` : "No data yet"}
              </span>
            </div>

            <pre className="mt-4 max-h-[65vh] overflow-auto rounded-xl border border-slate-700 bg-slate-950/85 p-4 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
              {excerpt || "Upload a resume to see extracted content here."}
            </pre>
          </div>
        </section>

        {insights ? (
          <section className="mt-4 space-y-4">
            <div className="rounded-2xl border border-indigo-500/30 bg-[linear-gradient(180deg,rgba(30,41,99,0.32),rgba(2,6,23,0.95))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-white">AI Resume Improvement Report</h3>
                <span className="rounded-full border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-300">
                  Source: {insights.source === "openai" ? "OpenAI" : "Fallback analyzer"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{insights.summary}</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-rose-400/25 bg-[linear-gradient(180deg,rgba(120,26,46,0.28),rgba(2,6,23,0.95))] p-5">
                <h4 className="text-lg font-semibold text-rose-100">What Is Lacking</h4>
                <ol className="mt-3 space-y-2 text-sm text-slate-200">
                  {sortedLacking.map((item, index) => (
                    <li key={item} className="rounded-xl border border-rose-400/20 bg-slate-950/45 px-3 py-2">
                      <span className="mr-2 text-rose-300">{index + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-emerald-400/25 bg-[linear-gradient(180deg,rgba(6,78,59,0.32),rgba(2,6,23,0.95))] p-5">
                <h4 className="text-lg font-semibold text-emerald-100">How To Improve</h4>
                <ol className="mt-3 space-y-2 text-sm text-slate-200">
                  {sortedImprovements.map((item, index) => (
                    <li key={item} className="rounded-xl border border-emerald-400/20 bg-slate-950/45 px-3 py-2">
                      <span className="mr-2 text-emerald-300">{index + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(8,145,178,0.2),rgba(2,6,23,0.95))] p-5">
              <h4 className="text-lg font-semibold text-cyan-100">Optimized Resume Draft</h4>
              <pre className="mt-3 max-h-[55vh] overflow-auto rounded-xl border border-slate-700 bg-slate-950/85 p-4 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                {insights.optimizedResumeMarkdown}
              </pre>
            </div>
          </section>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
