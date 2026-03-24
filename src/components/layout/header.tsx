"use client";

import { AlertTriangle } from "lucide-react";

interface HeaderProps {
  emergencyStopActive: boolean;
}

export function Header({ emergencyStopActive }: HeaderProps) {
  if (!emergencyStopActive) return null;

  return (
    <header>
      <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
        <AlertTriangle className="size-4" />
        Emergency Stop Active — All approval requests are being held.
      </div>
    </header>
  );
}
