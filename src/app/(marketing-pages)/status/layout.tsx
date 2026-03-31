import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status - OKrunit",
  description: "Check the current status of OKrunit services.",
  alternates: { canonical: "https://okrunit.com/status" },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
