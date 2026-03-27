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
    <article className="space-y-10">
      <header className="rounded-xl border border-border/50 bg-[var(--card)] p-8 shadow-[var(--shadow-card)] sm:p-10">
        <p className="text-xs font-medium text-primary mb-1">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          {intro}
        </p>
      </header>

      <div className="space-y-10">{children}</div>
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
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {intro && (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{intro}</p>
        )}
      </div>
      {children}
    </section>
  );
}
