"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Admin Organizations Tab
// Table of all organizations with counts and impersonate action.
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, Users, FileCheck, Key, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrgWithCounts } from "@/lib/admin-types";

interface OrganizationsTabProps {
  organizations: OrgWithCounts[];
}

function getOrgInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

export function OrganizationsTab({ organizations }: OrganizationsTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleImpersonate = useCallback(
    async (orgId: string, orgName: string) => {
      const res = await fetch("/api/v1/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });

      if (res.ok) {
        toast.success(`Switched to ${orgName}`);
        router.push("/org/overview");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to impersonate organization");
      }
    },
    [router],
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">All Organizations</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[200px] pl-8 text-sm bg-white"
            />
          </div>
          <span className="text-muted-foreground text-sm">
            {filtered.length} of {organizations.length}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <p className="text-sm">
            {search ? "No organizations match your search." : "No organizations found."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Approvals</TableHead>
                <TableHead className="text-center">Connections</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((org, idx) => (
                <TableRow
                  key={org.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  {/* Organization with avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback
                          className={avatarColors[idx % avatarColors.length]}
                        >
                          {getOrgInitials(org.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>

                  {/* Members */}
                  <TableCell className="text-center">
                    <div
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                      title={`${org.member_count} team member${org.member_count !== 1 ? "s" : ""}`}
                    >
                      <Users className="size-3.5" />
                      {org.member_count}
                    </div>
                  </TableCell>

                  {/* Approvals */}
                  <TableCell className="text-center">
                    <div
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                      title={`${org.approval_count} approval request${org.approval_count !== 1 ? "s" : ""}`}
                    >
                      <FileCheck className="size-3.5" />
                      {org.approval_count}
                    </div>
                  </TableCell>

                  {/* Connections */}
                  <TableCell className="text-center">
                    <div
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                      title={`${org.connection_count} active connection${org.connection_count !== 1 ? "s" : ""}`}
                    >
                      <Key className="size-3.5" />
                      {org.connection_count}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {org.emergency_stop_active ? (
                      <Badge variant="destructive" className="gap-1">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-red-300" />
                        </span>
                        Emergency
                      </Badge>
                    ) : (
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        Active
                      </Badge>
                    )}
                  </TableCell>

                  {/* Created */}
                  <TableCell
                    className="text-muted-foreground whitespace-nowrap text-xs"
                    title={new Date(org.created_at).toLocaleString()}
                  >
                    {formatDistanceToNow(new Date(org.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>

                  {/* Impersonate */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleImpersonate(org.id, org.name)}
                      title={`Switch to ${org.name}`}
                    >
                      <LogIn className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
