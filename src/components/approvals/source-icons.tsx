"use client";

import { Globe, Link2, Code2, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "@/lib/types/database";

// ---- SVG platform logos (inline, small, mono-friendly) --------------------

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
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-3.07l-3.5-2.02 3.5-2.02V7.5L5.5 12 11 16.5zm2 0L18.5 12 13 7.5v2.89l3.5 2.02-3.5 2.02v3.07z" />
    </svg>
  );
}

function N8nLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.8 4.2c-.9 0-1.7.5-2.1 1.2L7.5 6.5c-.1-.1-.2-.1-.3-.2-.6-.3-1.2-.3-1.8-.1-.6.2-1 .7-1.3 1.2-.5 1-.1 2.3.9 2.8l.3.2-3.1 1.1c-.7.2-1.2.8-1.3 1.5-.2.7 0 1.5.5 2l.1.1c-.2.4-.2.8-.1 1.2.2.7.7 1.2 1.4 1.4l3.2 1.1-.3.2c-1 .5-1.4 1.8-.9 2.8.3.5.7 1 1.3 1.2.6.2 1.2.2 1.8-.1l.3-.2 3.2 1.1c.4 1 1.3 1.7 2.4 1.7 1.4 0 2.5-1.1 2.5-2.5 0-.3 0-.5-.1-.8l3.2-1.1.3.2c.5.3 1.2.3 1.8.1.6-.2 1-.7 1.3-1.2.5-1 .1-2.3-.9-2.8l-.3-.2 3.2-1.1c.7-.2 1.2-.8 1.3-1.5.2-.7 0-1.5-.5-2l-.1-.1c.2-.4.2-.8.1-1.2-.2-.7-.7-1.2-1.4-1.4l-3.2-1.1.3-.2c1-.5 1.4-1.8.9-2.8-.3-.5-.7-1-1.3-1.2-.6-.2-1.2-.2-1.8.1l-.3.2-3.2-1.1c-.2-.6-.7-1.1-1.3-1.4-.4-.2-.7-.2-1.1-.2z" />
    </svg>
  );
}

// ---- Source configuration -------------------------------------------------

export interface SourceDisplayConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // Tailwind text color for the icon
  bgColor: string; // Tailwind bg color for the badge/avatar
}

export const SOURCE_CONFIG: Record<string, SourceDisplayConfig> = {
  zapier: {
    label: "Zapier",
    icon: ZapierLogo,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  make: {
    label: "Make",
    icon: MakeLogo,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
  },
  n8n: {
    label: "n8n",
    icon: N8nLogo,
    color: "text-rose-600",
    bgColor: "bg-rose-100",
  },
  windmill: {
    label: "Windmill",
    icon: Workflow,
    color: "text-sky-600",
    bgColor: "bg-sky-100",
  },
  api: {
    label: "API",
    icon: Code2,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
};

/**
 * Resolve the display config for an approval request's source.
 * Priority: explicit source → connectionName → connection_id → generic fallback
 */
export function getSourceDisplay(
  approval: ApprovalRequest,
  connectionName?: string,
): SourceDisplayConfig {
  // 1. Explicit source field matches a known platform
  if (approval.source && SOURCE_CONFIG[approval.source]) {
    return SOURCE_CONFIG[approval.source];
  }

  // 2. Has a recognized source string we can fuzzy-match
  if (approval.source) {
    const lower = approval.source.toLowerCase();
    for (const [key, config] of Object.entries(SOURCE_CONFIG)) {
      if (lower.includes(key)) return config;
    }
    // Unknown but explicit source — show as-is
    return {
      label: approval.source,
      icon: Globe,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  }

  // 3. Has a connection name (came via API key)
  if (connectionName) {
    return {
      label: connectionName,
      icon: Link2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    };
  }

  // 4. Has a connection_id but no name resolved
  if (approval.connection_id) {
    return {
      label: "API Connection",
      icon: Link2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    };
  }

  // 5. Fallback — generic integration
  return {
    label: "Integration",
    icon: Globe,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  };
}

/**
 * Small inline badge showing source icon + label.
 */
export function SourceBadge({
  approval,
  connectionName,
  className,
}: {
  approval: ApprovalRequest;
  connectionName?: string;
  className?: string;
}) {
  const config = getSourceDisplay(approval, connectionName);
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={cn("flex items-center justify-center rounded size-4", config.bgColor)}>
        <Icon className={cn("size-2.5", config.color)} />
      </span>
      <span className="truncate">{config.label}</span>
    </span>
  );
}

/**
 * Slightly larger avatar-style icon for the source, used in card layouts.
 */
export function SourceAvatar({
  approval,
  connectionName,
  size = "sm",
}: {
  approval: ApprovalRequest;
  connectionName?: string;
  size?: "sm" | "md";
}) {
  const config = getSourceDisplay(approval, connectionName);
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "size-6 rounded" : "size-8 rounded-lg";
  const iconSize = size === "sm" ? "size-3.5" : "size-4.5";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        sizeClasses,
        config.bgColor,
      )}
    >
      <Icon className={cn(iconSize, config.color)} />
    </span>
  );
}
