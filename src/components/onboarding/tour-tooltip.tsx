"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourTooltipProps {
  targetSelector: string | null;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  actionLabel: string;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TourTooltip({
  targetSelector,
  title,
  description,
  position,
  actionLabel,
  stepNumber,
  totalSteps,
  onNext,
  onSkip,
}: TourTooltipProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find and track the target element
  useEffect(() => {
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let attempts = 0;

    function findTarget() {
      const el = document.querySelector(targetSelector as string);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setTargetRect(el.getBoundingClientRect()), 400);
        }
        return;
      }
      attempts++;
      if (attempts < 60) timeout = setTimeout(findTarget, 50);
    }

    findTarget();

    function handleReposition() {
      const el = document.querySelector(targetSelector as string);
      if (el) setTargetRect(el.getBoundingClientRect());
    }

    window.addEventListener("scroll", handleReposition, { passive: true });
    window.addEventListener("resize", handleReposition);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleReposition);
      window.removeEventListener("resize", handleReposition);
    };
  }, [targetSelector]);

  if (!mounted) return null;

  const isCentered = position === "center" || !targetRect;

  let tooltipStyle: React.CSSProperties;
  if (isCentered) {
    tooltipStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else {
    const gap = 12;
    const r = targetRect!;
    switch (position) {
      case "bottom":
        tooltipStyle = { position: "fixed", top: r.bottom + gap, left: Math.max(16, Math.min(r.left, window.innerWidth - 380)) };
        break;
      case "top":
        tooltipStyle = { position: "fixed", bottom: window.innerHeight - r.top + gap, left: Math.max(16, Math.min(r.left, window.innerWidth - 380)) };
        break;
      case "left":
        tooltipStyle = { position: "fixed", top: r.top, right: window.innerWidth - r.left + gap };
        break;
      case "right":
      default:
        tooltipStyle = { position: "fixed", top: r.top, left: r.right + gap };
        break;
    }
  }

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40" onClick={onSkip}
        style={targetRect && !isCentered ? {
          clipPath: `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${targetRect.left - 8}px ${targetRect.top - 8}px, ${targetRect.left - 8}px ${targetRect.bottom + 8}px, ${targetRect.right + 8}px ${targetRect.bottom + 8}px, ${targetRect.right + 8}px ${targetRect.top - 8}px, ${targetRect.left - 8}px ${targetRect.top - 8}px)`
        } : undefined}
      />

      {/* Highlight ring */}
      {targetRect && !isCentered && (
        <div className="fixed z-[9999] rounded-lg ring-2 ring-primary ring-offset-2 pointer-events-none"
          style={{ top: targetRect.top - 4, left: targetRect.left - 4, width: targetRect.width + 8, height: targetRect.height + 8 }}
        />
      )}

      {/* Tooltip */}
      <div ref={tooltipRef} className="fixed z-[10000] w-[360px] rounded-xl border border-border bg-white shadow-2xl dark:bg-card" style={tooltipStyle}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-xs font-medium text-primary">Step {stepNumber} of {totalSteps}</p>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">{title}</h3>
            </div>
            <button onClick={onSkip} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Skip tour">
              <X className="size-4" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          <div className="flex items-center justify-between mt-4">
            <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground">Skip tour</button>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onNext}>
              {actionLabel}
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </div>
        <div className="h-1 bg-muted rounded-b-xl overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
        </div>
      </div>
    </>,
    document.body,
  );
}
