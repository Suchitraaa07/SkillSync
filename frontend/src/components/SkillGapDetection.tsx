type SkillGapDetectionProps = {
  matchedSkills: string[];
  missingSkills: string[];
  totalGaps: number;
};

const recommendationForSkill = (skill: string) => {
  const lower = skill.toLowerCase();
  if (lower.includes("react") || lower.includes("frontend")) {
    return `Build one UI-focused mini project to demonstrate ${skill}.`;
  }
  if (lower.includes("sql") || lower.includes("mongodb") || lower.includes("database")) {
    return `Practice ${skill} with 20+ hands-on queries and schema design exercises.`;
  }
  if (lower.includes("python") || lower.includes("machine learning") || lower.includes("nlp")) {
    return `Complete one end-to-end notebook project using ${skill} and publish it.`;
  }
  return `Add ${skill} into one project and include measurable impact in resume bullets.`;
};

export function SkillGapDetection({
  matchedSkills,
  missingSkills,
  totalGaps,
}: SkillGapDetectionProps) {
  return (
    <section className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(16,185,129,0.15),rgba(30,41,59,0.58)_30%,rgba(15,23,42,0.85)_62%,rgba(2,6,23,0.95))] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.38)] backdrop-blur-xl transition duration-300 hover:scale-[1.01] hover:shadow-[0_24px_75px_rgba(16,185,129,0.2)]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 top-6 h-28 w-28 rounded-full bg-cyan-400/12 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent opacity-40" />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-3xl font-semibold text-white">Skill Gap Detection</h3>
        <span className="rounded-full border border-amber-300/35 bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-100">
          Total Gaps: {totalGaps}
        </span>
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-emerald-300/35 via-cyan-300/25 to-transparent" />

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4">
          <p className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-emerald-200">
            Matched Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.length ? (
              matchedSkills.map((skill) => (
                <span
                  key={skill}
                  title={`Matched: ${skill}`}
                  className="cursor-default rounded-full border border-emerald-200/45 bg-gradient-to-r from-emerald-500/35 to-teal-400/30 px-4 py-1.5 text-sm font-semibold text-emerald-50 shadow-[0_0_14px_rgba(52,211,153,0.28)] transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(52,211,153,0.42)]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-base leading-relaxed text-slate-300">No matched skills detected yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-4">
          <p className="mb-3 text-base font-semibold uppercase tracking-[0.14em] text-rose-200">
            Missing Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length ? (
              missingSkills.map((skill) => (
                <span
                  key={skill}
                  title={`Missing: ${skill}`}
                  className="cursor-default rounded-full border border-rose-200/45 bg-gradient-to-r from-rose-500/35 to-red-400/30 px-4 py-1.5 text-sm font-semibold text-rose-50 shadow-[0_0_14px_rgba(251,113,133,0.28)] transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(251,113,133,0.42)]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-base leading-relaxed text-slate-300">No critical gaps. Great alignment.</p>
            )}
          </div>
        </div>
      </div>

      {missingSkills.length ? (
        <div className="mt-5 rounded-xl border border-emerald-300/20 bg-[linear-gradient(150deg,rgba(16,185,129,0.13),rgba(15,23,42,0.65))] p-4 backdrop-blur">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-indigo-300">
            Recommendations
          </p>
          <ul className="mt-2 space-y-2 text-base leading-relaxed text-slate-200">
            {missingSkills.slice(0, 4).map((skill) => (
              <li key={skill}>• {recommendationForSkill(skill)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
