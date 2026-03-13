"use client";

import { usePathname } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface HeaderV2Props {
  emergencyStopActive: boolean;
}

const routeBreadcrumbs: Record<string, { section?: string; title: string }> = {
  "/v2/dashboard": { title: "Dashboard" },
  "/v2/connections": { section: "Configuration", title: "Connections" },
  "/v2/rules": { section: "Configuration", title: "Rules" },
  "/v2/team": { section: "Configuration", title: "Team" },
  "/v2/teams": { section: "Configuration", title: "Teams" },
  "/v2/organization": { section: "Configuration", title: "Organization" },
  "/v2/analytics": { section: "Monitoring", title: "Analytics" },
  "/v2/audit-log": { section: "Monitoring", title: "Audit Log" },
  "/v2/webhooks": { section: "Monitoring", title: "Webhooks" },
  "/v2/playground": { section: "Developer", title: "Playground" },
  "/v2/settings": { section: "System", title: "Settings" },
  "/v2/emergency": { section: "System", title: "Emergency Controls" },
  "/v2/admin": { section: "System", title: "Admin" },
};

function getBreadcrumbs(pathname: string): { section?: string; title: string } {
  for (const [route, breadcrumb] of Object.entries(routeBreadcrumbs)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return breadcrumb;
    }
  }
  return { title: "Dashboard" };
}

export function HeaderV2({ emergencyStopActive }: HeaderV2Props) {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumbs(pathname);

  return (
    <header className="relative border-b border-[var(--border)]" style={{ borderImage: "linear-gradient(to right, var(--border), rgba(99,102,241,0.2), var(--border)) 1" }}>
      {emergencyStopActive && (
        <div className="emergency-banner flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
          <AlertTriangle className="size-4" />
          Emergency Stop Active — All approval requests are being held.
        </div>
      )}
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-1.5 text-sm">
          {breadcrumb.section && (
            <>
              <span className="text-muted-foreground">{breadcrumb.section}</span>
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
            </>
          )}
          <span className="font-medium">{breadcrumb.title}</span>
        </div>
      </div>
    </header>
  );
}
