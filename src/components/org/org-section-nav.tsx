"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Mail, UsersRound, Building2 } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  badge?: number;
}

interface OrgSectionNavProps {
  isAdmin: boolean;
  pendingInviteCount: number;
  children: React.ReactNode;
}

export function OrgSectionNav({ isAdmin, pendingInviteCount, children }: OrgSectionNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    { id: "overview", label: "Overview", href: "/org/overview", icon: LayoutDashboard },
    { id: "members", label: "Members", href: "/org/members", icon: Users, adminOnly: true },
    { id: "invites", label: "Invites", href: "/org/invites", icon: Mail, adminOnly: true, badge: pendingInviteCount > 0 ? pendingInviteCount : undefined },
    { id: "teams", label: "Teams", href: "/org/teams", icon: UsersRound, adminOnly: true },
    { id: "organization", label: "Organization", href: "/org/organization", icon: Building2, adminOnly: true },
  ];

  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex flex-col md:flex-row md:gap-8">
      {/* Left nav — desktop */}
      <nav className="hidden w-48 shrink-0 md:block">
        <div className="sticky top-6 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile nav — dropdown */}
      <div className="w-full md:hidden">
        <select
          value={visibleItems.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.href ?? "/org/overview"}
          onChange={(e) => {
            router.push(e.target.value);
          }}
          className="mb-4 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {visibleItems.map((item) => (
            <option key={item.id} value={item.href}>
              {item.label}{item.badge ? ` (${item.badge})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
