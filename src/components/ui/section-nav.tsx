"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SectionNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface SectionNavProps {
  items: SectionNavItem[];
  defaultSection?: string;
  children: (activeSection: string) => React.ReactNode;
}

export function SectionNav({ items, defaultSection, children }: SectionNavProps) {
  const [active, setActive] = useState(defaultSection ?? items[0]?.id ?? "");

  return (
    <div className="flex flex-col md:flex-row md:gap-8">
      {/* Left nav */}
      <nav className="hidden w-48 shrink-0 md:block">
        <div className="sticky top-6 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left cursor-pointer",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile dropdown — shown below md breakpoint */}
      <div className="w-full md:hidden">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="mb-4 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}{item.badge !== undefined ? ` (${item.badge})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        {children(active)}
      </div>
    </div>
  );
}
