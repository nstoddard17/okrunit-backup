"use client";

import { DashboardLayout } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { LayoutGrid, Rows3, Columns2 } from "lucide-react";

interface LayoutToggleProps {
  layout: DashboardLayout;
  onChange: (layout: DashboardLayout) => void;
}

const options: {
  value: DashboardLayout;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "cards", label: "Cards", icon: LayoutGrid },
  { value: "grouped", label: "Grouped", icon: Rows3 },
  { value: "split", label: "Split", icon: Columns2 },
];

export function LayoutToggle({ layout, onChange }: LayoutToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted/50 p-1 gap-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs font-medium transition",
            layout === value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-3.5 mr-1.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
