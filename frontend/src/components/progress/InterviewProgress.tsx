"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type InterviewEvaluationFinal = {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  overallInterviewScore: number;
  feedback: string;
  previousReadiness: number;
  newReadiness: number;
  readinessCategory: string;
};

type InterviewProgressProps = {
  initialInterviewScore: number;
  initialReadinessScore: number;
  onReadinessUpdated?: (payload: { newReadiness: number; readinessCategory: string }) => void;
};

type StreamEvent =
  | { type: "token"; content: string }
  | { type: "final"; data: InterviewEvaluationFinal }
  | { type: "error"; message: string };

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getUserIdFromToken = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const json = JSON.parse(atob(parts[1]));
    return typeof json?.userId === "string" ? json.userId : "";
  } catch {
    return "";
  }
};

const useScoreAnimation = (initialScore: number) => {
  const [animatedScore, setAnimatedScore] = useState(clamp(initialScore));
  const frameRef = useRef<number | null>(null);

  const animateTo = (target: number, durationMs = 900) => {
    const start = performance.now();
    const from = animatedScore;
    const to = clamp(target);

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setAnimatedScore(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  return { animatedScore, animateTo };
};

export function InterviewProgress({
  initialInterviewScore,
  initialReadinessScore,
  onReadinessUpdated,
}: InterviewProgressProps) {
  const [question, setQuestion] = useState("Tell me about a backend optimization you shipped and how you measured impact.");
  const [answer, setAnswer] = useState("");
  const [streamedFeedback, setStreamedFeedback] = useState("");
  const [statusText, setStatusText] = useState<"idle" | "analyzing" | "done">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicalScore, setTechnicalScore] = useState(0);
  const [communicationScore, setCommunicationScore] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [readinessScore, setReadinessScore] = useState(clamp(initialReadinessScore));
  const { animatedScore, animateTo } = useScoreAnimation(initialInterviewScore);

  const circleDash = useMemo(() => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;
    return { radius, circumference, offset };
  }, [animatedScore]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setStatusText("analyzing");
      setStreamedFeedback("");

      const token = typeof window !== "undefined" ? localStorage.getItem("skillsync_token") || "" : "";
      const userId = getUserIdFromToken(token);

      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, question, answer }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to stream interview evaluation");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let payload: StreamEvent;
          try {
            payload = JSON.parse(trimmed);
          } catch {
            continue;
          }

          if (payload.type === "token") {
            setStreamedFeedback((prev) => prev + payload.content);
          }

          if (payload.type === "final") {
            const data = payload.data;
            setTechnicalScore(clamp(data.technicalScore));
            setCommunicationScore(clamp(data.communicationScore));
            setConfidenceScore(clamp(data.confidenceScore));
            setReadinessScore(clamp(data.newReadiness));
            setStreamedFeedback(data.feedback || "");
            animateTo(clamp(data.overallInterviewScore));
            onReadinessUpdated?.({
              newReadiness: clamp(data.newReadiness),
              readinessCategory: data.readinessCategory,
            });
            setStatusText("done");
          }

          if (payload.type === "error") {
            throw new Error(payload.message || "Evaluation failed");
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evaluation failed";
      setStreamedFeedback(message);
      setStatusText("done");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
        <h3 className="text-lg font-semibold text-slate-100">Interview Progress</h3>
        <p className="mt-1 text-sm text-slate-400">Real-time AI evaluation updates as your answer is analyzed.</p>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
              <circle cx="70" cy="70" r={circleDash.radius} className="fill-none stroke-slate-700" strokeWidth="11" />
              <circle
                cx="70"
                cy="70"
                r={circleDash.radius}
                className="fill-none stroke-emerald-400 transition-all duration-200"
                strokeWidth="11"
                strokeDasharray={circleDash.circumference}
                strokeDashoffset={circleDash.offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-white">{animatedScore}</span>
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Score</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {[
              { label: "Technical", value: technicalScore },
              { label: "Communication", value: communicationScore },
              { label: "Confidence", value: confidenceScore },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{metric.label}</span>
                  <span className="font-medium text-slate-100">{metric.value}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-400" style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-300">
          Overall readiness score: <span className="font-semibold text-emerald-200">{readinessScore}%</span>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1.5 text-sm text-slate-300">
            <span>Interview Question</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring"
              placeholder="Enter interview question"
            />
          </label>

          <label className="block space-y-1.5 text-sm text-slate-300">
            <span>Your Answer</span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring"
              placeholder="Write your response here"
            />
          </label>

          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                statusText === "analyzing" ? "text-amber-200" : statusText === "done" ? "text-emerald-200" : "text-slate-400"
              }`}
            >
              {statusText === "analyzing" ? "Analyzing..." : statusText === "done" ? "Evaluation Complete" : "Ready"}
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !answer.trim()}
              className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Streaming..." : "Evaluate Answer"}
            </button>
          </div>
        </form>

        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Live Feedback</p>
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {streamedFeedback || "Feedback will stream here in real time."}
          </div>
        </div>
      </section>
    </div>
  );
}
