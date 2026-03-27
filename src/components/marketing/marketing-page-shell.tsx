import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketingPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="space-y-12">
      <header className="rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#f4fbf5_0%,#ffffff_58%,#edf8ee_100%)] p-8 shadow-[0_12px_36px_rgba(15,23,42,0.05)] sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          {intro}
        </p>
      </header>

      <div className="space-y-12">{children}</div>
    </article>
  );
}

export function MarketingPageSection({
  title,
  intro,
  children,
  className,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {intro && (
          <p className="max-w-3xl text-base leading-7 text-slate-600">{intro}</p>
        )}
      </div>
      {children}
    </section>
  );
}
