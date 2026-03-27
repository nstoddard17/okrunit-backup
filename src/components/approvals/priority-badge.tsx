import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApprovalPriority } from "@/lib/types/database";

interface PriorityBadgeProps {
  priority: ApprovalPriority;
}

const priorityConfig: Record<
  ApprovalPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "border-zinc-300 text-zinc-500 bg-transparent",
  },
  medium: {
    label: "Medium",
    className: "border-blue-300 text-blue-600 bg-transparent",
  },
  high: {
    label: "High",
    className: "border-orange-300 text-orange-600 bg-transparent",
  },
  critical: {
    label: "Critical",
    className: "border-red-300 text-red-600 bg-transparent",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
