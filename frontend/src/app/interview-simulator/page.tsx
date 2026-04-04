"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { api } from "@/lib/api";

export default function InterviewSimulatorPage() {
  const [role, setRole] = useState("web dev");
  const [questions, setQuestions] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const loadQuestions = useCallback(async () => {
    const { data } = await api.post<{ questions: string[] }>("/interview", { role });
    setQuestions(data.questions);
    setQuestion(data.questions[0] || "");
  }, [role]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const onEvaluate = async (e: FormEvent) => {
    e.preventDefault();
    const { data } = await api.post<{ score: number; feedback: string }>("/interview", {
      role,
      question,
      answer,
    });
    setResult(data);
  };

  return (
    <AuthGuard>
      <AppShell>
        <Card title="AI Interview Simulator">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <div>
              <label className="text-sm text-slate-500">Role</label>
              <select className="mt-1 w-full rounded-lg border p-2" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="web dev">Web Dev</option>
                <option value="ml engineer">ML Engineer</option>
                <option value="data analyst">Data Analyst</option>
              </select>
              <button onClick={loadQuestions} className="mt-2 w-full rounded-lg bg-slate-900 py-2 text-sm text-white">Refresh Questions</button>
              <ul className="mt-3 space-y-2 text-xs">
                {questions.map((q) => (
                  <li key={q}>
                    <button onClick={() => setQuestion(q)} className="w-full rounded bg-slate-100 p-2 text-left hover:bg-slate-200">{q}</button>
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={onEvaluate} className="space-y-3">
              <textarea className="h-24 w-full rounded-lg border p-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
              <textarea className="h-40 w-full rounded-lg border p-2" placeholder="Type your interview answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
              <button className="rounded-lg bg-emerald-700 px-4 py-2 text-white">Evaluate Answer</button>
            </form>
          </div>

          {result ? (
            <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-2xl font-bold">Score: {result.score}/100</p>
              <p className="mt-2 text-sm leading-relaxed">{result.feedback}</p>
            </div>
          ) : null}
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
