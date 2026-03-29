import type { Organization, UserProfile } from "@/lib/types/database";

export interface OrgWithCounts extends Organization {
  member_count: number;
  approval_count: number;
  connection_count: number;
  owner_name: string | null;
  owner_email: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
}

export interface UserWithMemberships extends UserProfile {
  memberships: { org_id: string; org_name: string; role: string }[];
}

export interface SystemStats {
  total_orgs: number;
  total_users: number;
  total_approvals: number;
  pending_approvals: number;
  approved_count: number;
  rejected_count: number;
  active_connections: number;
  emergency_stops_active: number;
}
