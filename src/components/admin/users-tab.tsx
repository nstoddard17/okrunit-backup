"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Admin Users Tab
// Table of all users with their org memberships and app admin status.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { UserWithMemberships } from "@/app/(dashboard)/admin/page";

interface UsersTabProps {
  users: UserWithMemberships[];
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

export function UsersTab({ users }: UsersTabProps) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">All Users</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[220px] pl-8 text-sm"
            />
          </div>
          <span className="text-muted-foreground text-sm">
            {filtered.length} of {users.length}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <p className="text-sm">
            {search ? "No users match your search." : "No users found."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow
                  key={user.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  {/* User with avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.full_name ?? user.email}
                        </p>
                        {user.full_name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Organizations */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.memberships.length === 0 ? (
                        <span className="text-muted-foreground text-xs italic">
                          No organizations
                        </span>
                      ) : (
                        user.memberships.map((m) => (
                          <Badge
                            key={m.org_id}
                            variant="outline"
                            className="text-xs"
                          >
                            {m.org_name}
                            <span className="ml-1 text-muted-foreground">
                              {m.role}
                            </span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>

                  {/* App Admin */}
                  <TableCell>
                    {user.is_app_admin ? (
                      <Badge className="gap-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                        <ShieldAlert className="size-3" />
                        App Admin
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        User
                      </span>
                    )}
                  </TableCell>

                  {/* Joined */}
                  <TableCell
                    className="text-muted-foreground whitespace-nowrap text-xs"
                    title={new Date(user.created_at).toLocaleString()}
                  >
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                    })}
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
