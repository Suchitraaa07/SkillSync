"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { RoleCard } from "@/components/job-role-comparison/RoleCard";
import { TestModal } from "@/components/job-role-comparison/TestModal";
import { QuestionItem, RoleMatch } from "@/components/job-role-comparison/types";

type JobRoleComparisonDashboardProps = {
  roles: RoleMatch[];
  targetRole: string;
  extractedSkills: string[];
};

const clampMatch = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const statusLabel = (match: number, isTop: boolean) => {
  if (isTop) return "Best Fit \u2B50";
  if (match >= 80) return "Eligible";
  if (match >= 50) return "Moderate Fit";
  return "Not Eligible";
};

const evaluateAnswerQuality = (answer: string, skills: string[]) => {
  const normalized = answer.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean).length;
  const lengthScore = Math.min(40, words * 2);

  const skillHits = skills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(normalized)
  ).length;
  const skillScore = skills.length ? Math.min(40, Math.round((skillHits / skills.length) * 40)) : 12;

  const impactWords = /built|implemented|optimized|improved|shipped|reduced|increased|designed/i.test(answer)
    ? 20
    : 8;
  return Math.min(100, lengthScore + skillScore + impactWords);
};

export function JobRoleComparisonDashboard({
  roles,
  targetRole,
  extractedSkills,
}: JobRoleComparisonDashboardProps) {
  const [roleMatches, setRoleMatches] = useState<RoleMatch[]>(roles.map((role) => ({ ...role, match: clampMatch(role.match) })));
  const [activeRole, setActiveRole] = useState<RoleMatch | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastDeltaByRole, setLastDeltaByRole] = useState<Record<string, number>>({});

  const sortedRoles = useMemo(
    () => [...roleMatches].sort((a, b) => b.match - a.match),
    [roleMatches]
  );

  const topRole = sortedRoles[0];
  const target = sortedRoles.find((role) => role.name.toLowerCase() === targetRole.toLowerCase());
  const showWarning = Boolean(topRole && target && topRole.name !== target.name);

  const openRoleTest = async (role: RoleMatch) => {
    setActiveRole(role);
    setQuestions([]);
    setAnswers({});
    setFeedback([]);
    setIsModalOpen(true);
    setIsFetchingQuestions(true);

    try {
      const response = await api.post<{ role: string; questions: QuestionItem[] }>("/api/generate-questions", {
        role: role.name,
        skills: extractedSkills,
      });
      setQuestions(response.data.questions || []);
    } catch {
      setQuestions([]);
      setFeedback(["Could not load questions right now. Please retry in a few seconds."]);
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const submitAssessment = () => {
    if (!activeRole || !questions.length) return;
    setIsSubmitting(true);

    const scored = questions.map((question) =>
      evaluateAnswerQuality(answers[question.id] || "", extractedSkills)
    );
    const avgScore = Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length);
    const delta = Math.max(2, Math.min(15, Math.round(avgScore / 12)));

    const generatedFeedback = [
      scored[0] >= 62
        ? "Your technical understanding is solid for this role."
        : "Your technical understanding is average; add clearer problem-solving steps.",
      scored[1] >= 62
        ? "Project explanation is strong and impact-driven."
        : "Project explanation needs improvement; include measurable outcomes.",
      scored[2] >= 62
        ? "Conceptual clarity is good with practical framing."
        : "Conceptual explanation is basic; connect concepts to real scenarios.",
    ];

    setRoleMatches((prev) =>
      prev.map((role) =>
        role.name === activeRole.name ? { ...role, match: clampMatch(role.match + delta) } : role
      )
    );
    setLastDeltaByRole((prev) => ({ ...prev, [activeRole.name]: delta }));
    setFeedback(generatedFeedback);
    setIsSubmitting(false);
  };

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-slate-400/20 bg-[linear-gradient(145deg,rgba(59,130,246,0.2),rgba(15,23,42,0.8)_40%,rgba(15,23,42,0.9))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Role Comparison</p>
        <h3 className="relative mt-1 text-2xl font-semibold text-white md:text-3xl">Job Role Comparison Dashboard</h3>
        {showWarning ? (
          <p className="relative mt-3 rounded-2xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            You are not best suited for {targetRole}. You are better suited for {topRole.name}.
          </p>
        ) : (
          <p className="relative mt-3 rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            Your target role {targetRole} is currently your strongest fit.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sortedRoles.map((role, index) => (
          <RoleCard
            key={role.name}
            role={role}
            isTop={index === 0}
            statusLabel={statusLabel(role.match, index === 0)}
            onTestMyself={openRoleTest}
            isTesting={activeRole?.name === role.name}
            scoreDelta={lastDeltaByRole[role.name]}
          />
        ))}
      </div>

      <TestModal
        isOpen={isModalOpen}
        roleName={activeRole?.name || ""}
        loading={isFetchingQuestions}
        questions={questions}
        answers={answers}
        feedback={feedback}
        submitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onAnswerChange={(questionId, value) =>
          setAnswers((prev) => ({ ...prev, [questionId]: value }))
        }
        onSubmit={submitAssessment}
      />
    </section>
  );
}

