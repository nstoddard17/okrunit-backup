"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/docs", label: "Getting Started" },
  { href: "/docs/api", label: "API Reference" },
  { href: "/docs/integrations", label: "Integrations" },
  { href: "/docs/webhooks", label: "Webhooks & Callbacks" },
  { href: "/docs/sso", label: "SSO / SAML" },
  { href: "/docs/billing", label: "Plans & Billing" },
  { href: "/docs/changelog", label: "Changelog" },
];

function isActive(pathname: string, href: string) {
  if (href === "/docs") return pathname === "/docs";
  return pathname.startsWith(href);
}

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-24 space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DocsMobileNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex gap-2 overflow-x-auto border-b border-zinc-200 pb-4 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
