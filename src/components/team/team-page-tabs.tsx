"use client";

import { SectionNav } from "@/components/ui/section-nav";
import { MemberList } from "@/components/team/member-list";
import { InviteForm } from "@/components/team/invite-form";
import { PendingInvites } from "@/components/team/pending-invites";
import { TeamList } from "@/components/teams/team-list";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";
import { Users, Mail, UsersRound, Building2 } from "lucide-react";
import type { SectionNavItem } from "@/components/ui/section-nav";
import type { OrgInvite, Organization, UserRole } from "@/lib/types/database";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  can_approve: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamMembershipData {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  can_approve: boolean;
}

export interface MemberActivityStats {
  decisions_30d: number;
  approved: number;
  rejected: number;
  last_active: string | null;
}

interface TeamPageTabsProps {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: string;
  canManageInvites: boolean;
  pendingInvites: OrgInvite[];
  teams: TeamData[];
  memberCounts: Record<string, number>;
  teamMemberships: TeamMembershipData[];
  orgMembers: OrgMember[];
  org: Organization;
  memberCount: number;
  memberStats: Record<string, MemberActivityStats>;
  pendingLoadMap: Record<string, number>;
}

export function TeamPageTabs({
  members,
  currentUserId,
  currentUserRole,
  canManageInvites,
  pendingInvites,
  teams,
  memberCounts,
  teamMemberships,
  orgMembers,
  org,
  memberCount,
  memberStats,
  pendingLoadMap,
}: TeamPageTabsProps) {
  const items: SectionNavItem[] = [
    { id: "members", label: "Members", icon: Users },
    ...(canManageInvites
      ? [{ id: "invites", label: "Invites", icon: Mail, badge: pendingInvites.length > 0 ? pendingInvites.length : undefined } as SectionNavItem]
      : []),
    { id: "groups", label: "Teams", icon: UsersRound },
    { id: "organization", label: "Organization", icon: Building2 },
  ];

  return (
    <SectionNav items={items} defaultSection="members">
      {(section) => (
        <>
          {section === "members" && (
            <MemberList
              members={members}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              memberStats={memberStats}
              pendingLoadMap={pendingLoadMap}
            />
          )}

          {section === "invites" && canManageInvites && (
            <div className="space-y-6">
              <InviteForm />
              {pendingInvites.length > 0 && (
                <PendingInvites
                  invites={pendingInvites}
                  canManage={canManageInvites}
                />
              )}
            </div>
          )}

          {section === "groups" && (
            <TeamList
              teams={teams}
              memberCounts={memberCounts}
              teamMemberships={teamMemberships}
              orgMembers={orgMembers}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          )}

          {section === "organization" && (
            <OrgSettingsForm
              org={org}
              role={currentUserRole as UserRole}
              memberCount={memberCount}
            />
          )}
        </>
      )}
    </SectionNav>
  );
}
