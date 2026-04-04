type ChecklistProps = {
  missingSkills: string[];
  selectedRole: string;
};

type Priority = "HIGH" | "MEDIUM" | "LOW";

type ChecklistItem = {
  skill: string;
  task: string;
  priority: Priority;
  impact: number;
};

const ROLE_CORE_SKILLS: Record<string, string[]> = {
  "Full Stack Developer": ["javascript", "react", "node.js", "mongodb", "sql"],
  "Frontend Developer": ["html", "css", "javascript", "react", "next.js"],
  "Backend Developer": ["node.js", "express", "mongodb", "sql", "rest api"],
  "Data Analyst": ["python", "sql", "data analysis", "excel"],
  "AI Engineer": ["python", "machine learning", "deep learning", "nlp"],
};

const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const priorityStyle: Record<Priority, string> = {
  HIGH: "border-rose-300/35 bg-rose-500/20 text-rose-100",
  MEDIUM: "border-amber-300/35 bg-amber-500/20 text-amber-100",
  LOW: "border-sky-300/35 bg-sky-500/20 text-sky-100",
};

const baseTaskForSkill = (skill: string) => {
  const lower = skill.toLowerCase();
  if (lower.includes("dsa") || lower.includes("algorithm") || lower.includes("data structures")) {
    return "Practice 50 DSA problems with complexity notes";
  }
  if (lower.includes("dbms") || lower.includes("sql") || lower.includes("database")) {
    return "Learn DBMS fundamentals and complete 20 SQL query drills";
  }
  if (lower.includes("node") || lower.includes("express") || lower.includes("backend")) {
    return "Build 1 backend project using Node.js and REST APIs";
  }
  if (lower.includes("react") || lower.includes("frontend") || lower.includes("next")) {
    return "Build 1 frontend project with reusable components and routing";
  }
  if (lower.includes("machine learning") || lower.includes("deep learning") || lower.includes("nlp")) {
    return "Ship 1 ML/NLP mini project with evaluation metrics";
  }
  if (lower.includes("python")) {
    return "Complete 30 Python practice tasks and one automation script";
  }
  return `Learn ${skill} fundamentals and apply it in one mini project`;
};

const priorityFromSkill = (skill: string, selectedRole: string): Priority => {
  const coreSkills = (ROLE_CORE_SKILLS[selectedRole] || []).map((item) => item.toLowerCase());
  const normalized = skill.toLowerCase();

  if (coreSkills.some((core) => normalized.includes(core) || core.includes(normalized))) {
    return "HIGH";
  }

  if (
    /git|testing|postman|excel|power bi|tailwind|redux|docker|aws|tableau/.test(normalized)
  ) {
    return "MEDIUM";
  }
  return "LOW";
};

const impactFromPriority = (priority: Priority, skill: string) => {
  const normalized = skill.toLowerCase();
  if (priority === "HIGH") {
    if (/dsa|algorithm|sql|node|react|python/.test(normalized)) return 15;
    return 12;
  }
  if (priority === "MEDIUM") return 9;
  return 6;
};

const buildChecklist = (missingSkills: string[], selectedRole: string): ChecklistItem[] => {
  return missingSkills
    .map((skill) => {
      const priority = priorityFromSkill(skill, selectedRole);
      return {
        skill,
        task: baseTaskForSkill(skill),
        priority,
        impact: impactFromPriority(priority, skill),
      };
    })
    .sort((a, b) => {
      const priorityDelta = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return b.impact - a.impact;
    });
};

export function PrioritizedImprovementChecklist({ missingSkills, selectedRole }: ChecklistProps) {
  if (!missingSkills.length) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-emerald-300/25 bg-[linear-gradient(150deg,rgba(16,185,129,0.16),rgba(15,23,42,0.8),rgba(2,6,23,0.95))] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <h3 className="text-xl font-semibold text-white">Priority Improvement Plan</h3>
        <p className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-100">
          You're already well-aligned with this role. Focus on polishing projects and applying.
        </p>
      </section>
    );
  }

  const checklist = buildChecklist(missingSkills, selectedRole);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(99,102,241,0.16),rgba(30,41,59,0.55),rgba(2,6,23,0.95))] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-400/15 blur-3xl" />
      <h3 className="text-xl font-semibold text-white">Priority Improvement Plan</h3>
      <p className="mt-2 text-sm text-slate-300">
        Complete high-impact tasks first to improve readiness faster.
      </p>
      <div className="mt-4 h-px bg-gradient-to-r from-indigo-300/35 via-cyan-300/20 to-transparent" />

      <div className="mt-5 space-y-3">
        {checklist.map((item, index) => (
          <article
            key={`${item.skill}-${index}`}
            className="group rounded-xl border border-white/10 bg-slate-900/55 p-4 transition duration-300 hover:scale-[1.01] hover:border-indigo-300/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.18)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 h-4 w-4 cursor-pointer accent-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-slate-100">{item.task}</p>
                  <p className="mt-1 text-xs text-slate-400">Skill target: {item.skill}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyle[item.priority]}`}
                >
                  {item.priority}
                </span>
                <span className="rounded-full border border-cyan-300/35 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
                  +{item.impact}%
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

