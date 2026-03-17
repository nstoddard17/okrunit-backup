"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface OrgSwitcherProps {
  currentOrgId: string;
  orgs: { id: string; org_id: string; org_name: string; role: string; is_default: boolean }[];
}

export function OrgSwitcher({ currentOrgId, orgs }: OrgSwitcherProps) {
  const router = useRouter();
  const currentOrg = orgs.find((o) => o.org_id === currentOrgId);

  async function switchOrg(orgId: string) {
    if (orgId === currentOrgId) return;

    await fetch("/api/v1/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId }),
    });

    router.refresh();
  }

  // If only one org, just show the name without a dropdown
  if (orgs.length <= 1) {
    return (
      <span className="text-muted-foreground truncate text-[11px] leading-tight">
        {currentOrg?.org_name ?? "No organization"}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 text-[11px] leading-tight text-muted-foreground hover:text-foreground transition-colors outline-none max-w-[170px]">
        <span className="truncate">{currentOrg?.org_name}</span>
        <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <Building2 className="size-3.5" />
          Organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.org_id}
            onClick={() => switchOrg(org.org_id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              org.org_id === currentOrgId && "font-medium",
            )}
          >
            <span className="flex-1 truncate">{org.org_name}</span>
            {org.org_id === currentOrgId && (
              <Check className="size-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
