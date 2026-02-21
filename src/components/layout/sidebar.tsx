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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { OrgSwitcher } from "@/components/layout/org-switcher";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  currentOrgId: string;
  userOrgs: { id: string; org_id: string; org_name: string; role: string; is_default: boolean }[];
  pendingCount: number;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/connections", label: "Connections", icon: Key },
  { href: "/team", label: "Team", icon: Users },
  { href: "/organization", label: "Organization", icon: Building2 },
  { href: "/rules", label: "Rules", icon: ShieldCheck },
  { href: "/audit-log", label: "Audit Log", icon: FileText },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/playground", label: "Playground", icon: FlaskConical },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle },
] as const;

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

export function Sidebar({ user, currentOrgId, userOrgs, pendingCount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="bg-card flex h-full w-64 flex-col border-r">
      {/* Logo / Org Header */}
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <img src="/logo.png" alt="Gatekeeper" width={28} height={28} className="size-7" />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold leading-tight">Gatekeeper</span>
          <OrgSwitcher currentOrgId={currentOrgId} orgs={userOrgs} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard" && pendingCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <Separator />
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar size="sm">
            <AvatarFallback>
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user.full_name ?? user.email}
            </p>
            {user.full_name && (
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            )}
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
