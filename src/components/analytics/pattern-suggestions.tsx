"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PatternSuggestion {
  type: "auto_approve" | "route";
  match_field: string;
  match_value: string;
  consecutive_approvals: number;
  total_approvals: number;
  total_rejections: number;
  approval_rate: number;
  description: string;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_STYLES = {
  high: { label: "High confidence", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium confidence", color: "bg-amber-100 text-amber-700" },
  low: { label: "Low confidence", color: "bg-zinc-100 text-zinc-600" },
};

export function PatternSuggestions() {
  const [suggestions, setSuggestions] = useState<PatternSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/analytics/patterns");
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreateRule(suggestion: PatternSuggestion) {
    const key = `${suggestion.match_field}:${suggestion.match_value}`;
    setCreating(key);
    try {
      const res = await fetch("/api/v1/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Auto-approve ${suggestion.match_field}: ${suggestion.match_value}`,
          description: suggestion.description,
          is_active: true,
          conditions: {
            [suggestion.match_field === "action_type" ? "action_types" : "sources"]:
              [suggestion.match_value],
          },
          action: "auto_approve",
          action_config: {},
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to create rule");
      }

      toast.success(`Auto-approve rule created for ${suggestion.match_value}`);
      setSuggestions((prev) =>
        prev.filter(
          (s) =>
            !(s.match_field === suggestion.match_field && s.match_value === suggestion.match_value),
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create rule");
    } finally {
      setCreating(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" />
                Rule Suggestions
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your approval history over the last 90 days
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <BarChart3 className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No patterns detected yet
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-xs">
              OKrunit analyzes your approval history to find sources or action types that are consistently approved. Suggestions appear once you have enough data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-500" />
              Rule Suggestions
              <Badge variant="secondary" className="text-[10px]">
                {suggestions.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Based on your approval history over the last 90 days
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const key = `${suggestion.match_field}:${suggestion.match_value}`;
            const conf = CONFIDENCE_STYLES[suggestion.confidence];

            return (
              <div
                key={key}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-white dark:bg-card px-3 py-2.5"
              >
                <TrendingUp className="size-4 mt-0.5 shrink-0 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">{suggestion.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={cn("text-[10px]", conf.color)}>
                      {conf.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {suggestion.approval_rate}% approval rate
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 shrink-0 bg-white dark:bg-card"
                  onClick={() => handleCreateRule(suggestion)}
                  disabled={creating === key}
                >
                  <CheckCircle className="size-3" />
                  {creating === key ? "Creating..." : "Create Rule"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
