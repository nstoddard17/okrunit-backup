"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";
import { TOUR_STEPS, PAGE_TOURS } from "@/components/onboarding/tour-steps";
import { AlertTriangle, Menu, HelpCircle, LogOut, Settings, Check, ChevronsUpDown, Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { useSidebarStore } from "@/stores/sidebar-store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface OrgItem {
  id: string;
  org_id: string;
  org_name: string;
  role: string;
  is_default: boolean;
}

interface HeaderProps {
  emergencyStopActive: boolean;
  user?: {
    email: string;
    full_name: string | null;
  };
  orgName?: string;
  pendingCount?: number;
  currentOrgId?: string;
  userOrgs?: OrgItem[];
  userId?: string;
}

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

export function Header({ emergencyStopActive, user, orgName, pendingCount = 0, currentOrgId, userOrgs = [], userId }: HeaderProps) {
  const router = useRouter();
  const { setMobileOpen } = useSidebarStore();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const hasMultipleOrgs = userOrgs.length > 1;

  async function switchOrg(orgId: string) {
    if (orgId === currentOrgId) return;
    await fetch("/api/v1/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId }),
    });
    router.refresh();
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header>
      {/* Emergency banner */}
      {emergencyStopActive && (
        <div className="emergency-banner flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
          <AlertTriangle className="size-4" />
          Emergency Stop Active — All approval requests are being held.
        </div>
      )}

      {/* Top bar */}
      <div className="top-bar flex items-center justify-between px-5">
        {/* Left: mobile menu + org name */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          {orgName && (
            hasMultipleOrgs ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold text-foreground outline-none transition-colors hover:bg-muted">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{orgName}</span>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Organizations
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userOrgs.map((org) => (
                    <DropdownMenuItem
                      key={org.org_id}
                      onClick={() => switchOrg(org.org_id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold">
                        {org.org_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{org.org_name}</span>
                      {org.org_id === currentOrgId && <Check className="size-4 shrink-0 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-none">{orgName}</span>
            )
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Tour progress indicator — left of search */}
          <TourHeaderIndicator />

          {/* Search / Cmd+K hint */}
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            className="hidden sm:flex items-center gap-2.5 rounded-lg border border-border bg-white dark:bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground shadow-sm min-w-[200px]"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium">
              {isMac ? <><span className="text-[14px] leading-none">⌘</span>K</> : "Ctrl+K"}
            </kbd>
          </button>

          <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
            <a href="https://okrunit.com/docs" target="_blank" rel="noopener noreferrer">
              <HelpCircle className="size-4" />
              <span className="hidden sm:inline text-xs">Help</span>
            </a>
          </Button>

          {/* Notification bell + panel */}
          <NotificationPanel pendingCount={pendingCount} userId={userId} />

          {/* User avatar dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex cursor-pointer items-center justify-center rounded-full outline-none ring-2 ring-primary/20 transition-shadow hover:ring-primary/40 focus-visible:ring-primary/50">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-white text-xs font-bold">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.full_name ?? user.email}</p>
                  {user.full_name && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings/account">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

function TourHeaderIndicator() {
  const pathname = usePathname();
  const { fullTourActive, activePageId, tourCompleted, tourDismissed, tourPaused, touredPages, startFullTour, resumeTour } =
    useOnboardingTourStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || tourCompleted || tourDismissed) return null;
  // Hide while tour tooltip is actively showing
  if (fullTourActive || activePageId) return null;
  // Only show if paused or has progress
  if (!tourPaused && touredPages.length === 0) return null;

  const totalPages = TOUR_STEPS.length;
  const toured = touredPages.length;
  const progress = Math.round((toured / Math.max(totalPages, 1)) * 100);

  const handleResume = () => {
    // Find the tour for the page the user is currently on
    const currentPage = PAGE_TOURS.find((p) =>
      p.pathname === "/org/overview" ? pathname === "/org/overview" : pathname === p.pathname
    );
    resumeTour(currentPage?.pageId);
  };

  return (
    <button
      onClick={tourPaused ? handleResume : startFullTour}
      className="hidden sm:flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-950"
    >
      <div className="relative size-4">
        <svg viewBox="0 0 36 36" className="size-4 -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${progress} 100`} strokeLinecap="round" />
        </svg>
      </div>
      Resume Tour
    </button>
  );
}
