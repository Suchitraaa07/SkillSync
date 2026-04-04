import { QuestionItem } from "./types";

type TestModalProps = {
  isOpen: boolean;
  roleName: string;
  loading: boolean;
  questions: QuestionItem[];
  answers: Record<string, string>;
  feedback: string[];
  submitting: boolean;
  onClose: () => void;
  onAnswerChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
};

export function TestModal({
  isOpen,
  roleName,
  loading,
  questions,
  answers,
  feedback,
  submitting,
  onClose,
  onAnswerChange,
  onSubmit,
}: TestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-300/20 bg-[linear-gradient(145deg,rgba(59,130,246,0.2),rgba(15,23,42,0.86)_45%,rgba(2,6,23,0.95))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">Role Assessment</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{roleName}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-100 border-t-transparent" />
            Generating AI questions...
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Question {index + 1} · {question.category}
                </p>
                <p className="mt-1 text-sm text-slate-100">{question.question}</p>

                {question.type === "mcq" && question.options?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={answers[question.id] === option}
                          onChange={() => onAnswerChange(question.id, option)}
                          className="h-3.5 w-3.5 accent-cyan-300"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    rows={3}
                    placeholder="Type your answer..."
                    className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                  />
                )}
              </div>
            ))}

            <button
              onClick={onSubmit}
              disabled={submitting || loading || questions.length === 0}
              className="w-full rounded-xl border border-cyan-300/40 bg-cyan-400/20 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Evaluating..." : "Submit Answers"}
            </button>

            {feedback.length ? (
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-100">Feedback</p>
                <ul className="mt-2 space-y-1 text-xs text-emerald-50/90">
                  {feedback.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

