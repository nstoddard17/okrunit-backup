"use client";

import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface HeaderProps {
  emergencyStopActive: boolean;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/connections": "Connections",
  "/team": "Team",
  "/audit-log": "Audit Log",
  "/settings": "Settings",
  "/emergency": "Emergency Controls",
};

function getPageTitle(pathname: string): string {
  for (const [route, title] of Object.entries(routeTitles)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return title;
    }
  }
  return "Dashboard";
}

export function Header({ emergencyStopActive }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="border-b">
      {emergencyStopActive && (
        <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
          <AlertTriangle className="size-4" />
          Emergency Stop Active -- All approval requests are being held.
        </div>
      )}
      <div className="flex h-14 items-center px-6">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
    </header>
  );
}
