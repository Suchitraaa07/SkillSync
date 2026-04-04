import { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-700/65 bg-[linear-gradient(180deg,rgba(18,25,47,0.92),rgba(10,14,28,0.9))] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur ${className}`}
    >
      {title ? <h3 className="mb-3 text-lg font-semibold text-slate-100">{title}</h3> : null}
      {children}
    </section>
  );
}
