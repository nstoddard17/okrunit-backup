"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourTooltipProps {
  targetSelector: string;
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  position?: "top" | "bottom" | "left" | "right";
}

export function TourTooltip({
  targetSelector,
  title,
  description,
  stepNumber,
  totalSteps,
  onNext,
  onSkip,
  position = "bottom",
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    targetRect: DOMRect | null;
  }>({ top: 0, left: 0, targetRect: null });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(targetSelector);
    if (!target) {
      // If target doesn't exist, auto-advance
      onNext();
      return;
    }

    const rect = target.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (position) {
      case "bottom":
        top = rect.bottom + scrollTop + gap;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "top":
        top = rect.top + scrollTop - gap;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "right":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + gap;
        break;
      case "left":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - gap;
        break;
    }

    setCoords({ top, left, targetRect: rect });
    setVisible(true);

    // Scroll target into view if needed
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetSelector, position, onNext]);

  if (!visible || !coords.targetRect) return null;

  const isLast = stepNumber === totalSteps;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/30" onClick={onSkip} />

      {/* Highlight cutout on the target element */}
      <div
        className="fixed z-[9999] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background pointer-events-none"
        style={{
          top: coords.targetRect.top - 4,
          left: coords.targetRect.left - 4,
          width: coords.targetRect.width + 8,
          height: coords.targetRect.height + 8,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[10000] w-72 rounded-lg border bg-popover p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200",
          position === "top" && "-translate-x-1/2 -translate-y-full",
          position === "bottom" && "-translate-x-1/2",
          position === "left" && "-translate-x-full -translate-y-1/2",
          position === "right" && "-translate-y-1/2",
        )}
        style={{ top: coords.top, left: coords.left }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onSkip}
            title="Skip tour"
          >
            <X className="size-3" />
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {stepNumber} of {totalSteps}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="xs" onClick={onSkip}>
              Skip tour
            </Button>
            <Button size="xs" onClick={onNext}>
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
