"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  Users,
  FileText,
  Webhook,
  Settings,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  BarChart3,
  FlaskConical,
  Building2,
  ShieldAlert,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "@/components/layout/org-switcher";

interface SidebarV2Props {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  currentOrgId: string;
  userOrgs: { id: string; org_id: string; org_name: string; role: string; is_default: boolean }[];
  pendingCount: number;
  userRole: string;
  isAppAdmin?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  appAdminOnly?: boolean;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/v2/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/v2/connections", label: "Connections", icon: Key, adminOnly: true },
      { href: "/v2/rules", label: "Rules", icon: ShieldCheck },
      { href: "/v2/team", label: "Team", icon: Users, adminOnly: true },
      { href: "/v2/organization", label: "Organization", icon: Building2, adminOnly: true },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/v2/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/v2/audit-log", label: "Audit Log", icon: FileText },
      { href: "/v2/webhooks", label: "Webhooks", icon: Webhook, adminOnly: true },
    ],
  },
  {
    label: "Developer",
    items: [
      { href: "/v2/playground", label: "Playground", icon: FlaskConical },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/v2/settings", label: "Settings", icon: Settings },
      { href: "/v2/emergency", label: "Emergency", icon: AlertTriangle, adminOnly: true },
      { href: "/v2/admin", label: "Admin", icon: ShieldAlert, appAdminOnly: true },
    ],
  },
];

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

export function SidebarV2({ user, currentOrgId, userOrgs, pendingCount, userRole, isAppAdmin }: SidebarV2Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = userRole === "owner" || userRole === "admin";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)]">
      {/* Logo / Org Header */}
      <div className="flex flex-col gap-2 border-b border-[var(--sidebar-border)] px-4 py-3">
        <Link href="/v2/dashboard" className="flex justify-center">
          <img src="/logo_text.png" alt="Gatekeeper" className="h-10 w-auto" />
        </Link>
        <OrgSwitcher currentOrgId={currentOrgId} orgs={userOrgs} />
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3">
        <button
          className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-[var(--ring)] hover:text-foreground"
          onClick={() => {/* Command palette — future enhancement */}}
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navSections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter((item) => {
            if (item.appAdminOnly && !isAppAdmin) return false;
            if (item.adminOnly && !isAdmin) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIndex} className={sectionIndex > 0 ? "mt-5" : ""}>
              {section.label && (
                <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                        isActive
                          ? "border-l-2 border-l-[var(--sidebar-primary)] bg-[var(--sidebar-accent)] font-medium text-foreground"
                          : "border-l-2 border-l-transparent text-muted-foreground hover:bg-[var(--sidebar-accent)]/60 hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/v2/dashboard" && pendingCount > 0 && (
                        <Badge className="h-5 min-w-5 bg-[var(--primary)] px-1.5 text-[10px] font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary)]">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium">
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user.full_name ?? user.email}
            </p>
            {user.full_name && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            title="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
