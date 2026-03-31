"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ClipboardList,
  Home,
  Settings,
  Users,
  UsersRound,
  Key,
  Route,
  BarChart3,
  GitBranch,
  CreditCard,
  Shield,
  Search,
  FileText,
  Bell,
  MessageSquare,
  Bug,
  LineChart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CommandPaletteProps {
  orgId: string;
}

const PAGES = [
  { name: "Overview", href: "/org/overview", icon: Home, section: "Navigate" },
  { name: "Requests", href: "/requests", icon: ClipboardList, section: "Navigate" },
  { name: "Connections", href: "/requests/connections", icon: Key, section: "Navigate" },
  { name: "Routes", href: "/requests/routes", icon: Route, section: "Navigate" },
  { name: "Rules", href: "/requests/rules", icon: GitBranch, section: "Navigate" },
  { name: "Messaging", href: "/requests/messaging", icon: MessageSquare, section: "Navigate" },
  { name: "Analytics", href: "/requests/analytics", icon: BarChart3, section: "Navigate" },
  { name: "SLA Compliance", href: "/requests/sla", icon: LineChart, section: "Navigate" },
  { name: "Teams", href: "/org/teams", icon: UsersRound, section: "Navigate" },
  { name: "Members", href: "/org/members", icon: Users, section: "Navigate" },
  { name: "Custom Roles", href: "/org/roles", icon: Shield, section: "Navigate" },
  { name: "Organizations", href: "/org/organizations", icon: Home, section: "Navigate" },
  { name: "Subscription", href: "/org/subscription", icon: CreditCard, section: "Navigate" },
  { name: "Account Settings", href: "/settings/account", icon: Settings, section: "Navigate" },
  { name: "Notification History", href: "/settings/notifications", icon: Bell, section: "Navigate" },
  { name: "Audit Log", href: "/requests/audit-log", icon: FileText, section: "Navigate" },
  { name: "Error Monitor", href: "/admin/errors", icon: Bug, section: "Admin" },
];

interface ApprovalResult {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export function CommandPalette({ orgId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [approvals, setApprovals] = useState<ApprovalResult[]>([]);
  const router = useRouter();

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search approvals when query changes
  useEffect(() => {
    if (!search || search.length < 2) {
      setApprovals([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("approval_requests")
          .select("id, title, status, priority")
          .ilike("title", `%${search}%`)
          .order("created_at", { ascending: false })
          .limit(5);
        setApprovals(data ?? []);
      } catch {
        // Silently fail
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    setSearch("");
    command();
  }, []);

  const statusColor: Record<string, string> = {
    pending: "text-amber-500",
    approved: "text-emerald-500",
    rejected: "text-red-500",
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-[100]"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-border bg-white shadow-2xl dark:bg-card sm:w-full">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search pages, approvals..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[320px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {/* Approval results */}
          {approvals.length > 0 && (
            <Command.Group heading="Approvals">
              {approvals.map((a) => (
                <Command.Item
                  key={a.id}
                  value={`approval-${a.title}`}
                  onSelect={() =>
                    runCommand(() => router.push(`/requests?highlight=${a.id}`))
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer data-[selected=true]:bg-muted"
                >
                  <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{a.title}</span>
                  <span className={`text-xs capitalize ${statusColor[a.status] ?? "text-muted-foreground"}`}>
                    {a.status}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Page navigation */}
          {["Navigate", "Admin"].map((section) => {
            const items = PAGES.filter((p) => p.section === section);
            if (items.length === 0) return null;
            return (
              <Command.Group key={section} heading={section}>
                {items.map((page) => {
                  const Icon = page.icon;
                  return (
                    <Command.Item
                      key={page.href}
                      value={page.name}
                      onSelect={() => runCommand(() => router.push(page.href))}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer data-[selected=true]:bg-muted"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span>{page.name}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            );
          })}
        </Command.List>

        <div className="border-t px-4 py-2">
          <p className="text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↑↓</kbd> navigate
            {" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↵</kbd> select
            {" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">esc</kbd> close
          </p>
        </div>
      </div>
    </Command.Dialog>
  );
}
