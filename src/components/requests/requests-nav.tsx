"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Key,
  Route,
  MessageSquare,
  BarChart3,
  ScrollText,
  CheckSquare,
  Wrench,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof ClipboardList;
  adminOnly?: boolean;
  badge?: number;
}

interface NavSection {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

interface RequestsNavProps {
  isAdmin: boolean;
  pendingCount: number;
  mobile?: boolean;
}

export function RequestsNav({ isAdmin, pendingCount, mobile }: RequestsNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const sections: NavSection[] = [
    {
      label: "Approvals",
      icon: CheckSquare,
      items: [
        {
          id: "inbox",
          label: "Requests",
          href: "/requests",
          icon: ClipboardList,
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
      ],
    },
    {
      label: "Configuration",
      icon: Wrench,
      items: [
        { id: "connections", label: "Connections", href: "/requests/connections", icon: Key, adminOnly: true },
        { id: "routes", label: "Routes", href: "/requests/routes", icon: Route, adminOnly: true },
        { id: "messaging", label: "Messaging", href: "/requests/messaging", icon: MessageSquare, adminOnly: true },
      ],
    },
    {
      label: "Insights",
      icon: LineChart,
      items: [
        { id: "analytics", label: "Analytics", href: "/requests/analytics", icon: BarChart3 },
        { id: "audit-log", label: "Audit Log", href: "/requests/audit-log", icon: ScrollText },
      ],
    },
  ];

  const allItems = sections.flatMap((s) => s.items).filter((item) => !item.adminOnly || isAdmin);

  function isActive(href: string) {
    if (href === "/requests") {
      return pathname === "/requests";
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  if (mobile) {
    return (
      <select
        value={allItems.find((i) => isActive(i.href))?.href ?? "/requests"}
        onChange={(e) => router.push(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      >
        {sections.map((section) => (
          <optgroup key={section.label} label={section.label}>
            {section.items
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => (
                <option key={item.id} value={item.href}>
                  {item.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    );
  }

  return (
    <nav className="flex-1 flex flex-col px-3" aria-label="Request sections">
      {sections.map((section, idx) => {
        const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;

        const SectionIcon = section.icon;
        return (
          <div key={section.label} className={cn(idx > 0 && "mt-4")}>
            <div className="flex items-center gap-2 px-3 mb-2">
              <SectionIcon className="size-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {section.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider after section */}
            <div className="mt-3 border-b border-border/40 mx-3" />
          </div>
        );
      })}
    </nav>
  );
}
