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
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  high: {
    label: "High",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
}
