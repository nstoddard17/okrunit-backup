"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: { value: number; label: string };
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  iconColor = "text-muted-foreground",
  className,
  onClick,
}: StatCardProps) {
  const trendIsPositive = trend && trend.value >= 0;

  return (
    <Card
      className={cn("card-interactive border-0 shadow-[var(--shadow-card)]", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={cn("rounded-lg bg-muted/50 p-2.5", iconColor)}>
            <Icon className="size-5" />
          </div>
        </div>
        {(subtitle || trend) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend ? (
              <>
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                  trendIsPositive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                )}>
                  {trendIsPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {trendIsPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
