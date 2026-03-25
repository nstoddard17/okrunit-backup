"use client";

import { Code2, Workflow, Globe } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Platform logos with inline SVGs for the ones we have               */
/* ------------------------------------------------------------------ */

function ZapierLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M63.207 26.418H44.432l13.193-13.193c-1.015-1.522-2.03-2.537-3.045-4.06a29.025 29.025 0 01-4.059-3.552L37.33 18.807V.54a17.252 17.252 0 00-5.074-.507A15.629 15.629 0 0027.18.54v18.775l-13.7-13.7A13.7 13.7 0 009.42 9.166c-1.015 1.522-2.537 2.537-3.552 4.06L19.06 26.418H.794l-.507 5.074a15.629 15.629 0 00.507 5.074H19.57l-13.7 13.7a27.198 27.198 0 007.611 7.611l13.193-13.193V63.46a17.252 17.252 0 005.074.507 15.629 15.629 0 005.074-.507V44.686L50.014 57.88a13.7 13.7 0 004.059-3.552 29.025 29.025 0 003.552-4.059L44.432 37.074h18.775A17.252 17.252 0 0063.715 32a19.028 19.028 0 00-.507-5.582zm-23.342 5.074a25.726 25.726 0 01-1.015 6.597 15.223 15.223 0 01-6.597 1.015 25.726 25.726 0 01-6.597-1.015 15.223 15.223 0 01-1.015-6.597 25.726 25.726 0 011.015-6.597 15.223 15.223 0 016.597-1.015 25.726 25.726 0 016.597 1.015 29.684 29.684 0 011.015 6.597z" />
    </svg>
  );
}

function MakeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13.38 3.498c-.27 0-.511.19-.566.465L9.85 18.986a.578.578 0 0 0 .453.678l4.095.826a.58.58 0 0 0 .682-.455l2.963-15.021a.578.578 0 0 0-.453-.678l-4.096-.826a.589.589 0 0 0-.113-.012zm-5.876.098a.576.576 0 0 0-.516.318L.062 17.697a.575.575 0 0 0 .256.774l3.733 1.877a.578.578 0 0 0 .775-.258l6.926-13.781a.577.577 0 0 0-.256-.776L7.762 3.658a.571.571 0 0 0-.258-.062zm11.74.115a.576.576 0 0 0-.576.576v15.426c0 .318.258.578.576.578h4.178a.58.58 0 0 0 .578-.578V4.287a.578.578 0 0 0-.578-.576Z" />
    </svg>
  );
}

interface LogoItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const logos: LogoItem[] = [
  { name: "Zapier", icon: ZapierLogo, color: "text-orange-500" },
  { name: "Make", icon: MakeLogo, color: "text-violet-600" },
  { name: "n8n", icon: Workflow, color: "text-rose-500" },
  { name: "GitHub Actions", icon: Code2, color: "text-gray-700" },
  { name: "Windmill", icon: Workflow, color: "text-sky-500" },
  { name: "Temporal", icon: Workflow, color: "text-indigo-500" },
  { name: "Prefect", icon: Workflow, color: "text-blue-500" },
  { name: "Dagster", icon: Workflow, color: "text-purple-500" },
  { name: "Pipedream", icon: Code2, color: "text-emerald-500" },
  { name: "REST API", icon: Globe, color: "text-gray-500" },
];

/* ------------------------------------------------------------------ */
/*  Infinite scrolling ticker using CSS animation                      */
/* ------------------------------------------------------------------ */

export function LogoTicker() {
  // Double the list so the scroll loops seamlessly
  const doubled = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />

      <div className="flex animate-[ticker_30s_linear_infinite] items-center gap-12">
        {doubled.map((logo, i) => {
          const Icon = logo.icon;
          return (
            <div
              key={`${logo.name}-${i}`}
              className="flex shrink-0 items-center gap-2.5"
            >
              <Icon className={`size-5 ${logo.color}`} />
              <span className="whitespace-nowrap text-sm font-medium text-gray-400">
                {logo.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
