import Image from "next/image";
import Link from "next/link";
import { HeroNav } from "@/components/landing/hero-nav";

interface MarketingSiteHeaderProps {
  user: { email: string; full_name: string | null } | null;
}

const NAV_ITEMS = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/integrations", label: "Integrations" },
  { href: "/docs/api", label: "API" },
  { href: "/docs/changelog", label: "Changelog" },
] as const;

export function MarketingSiteHeader({ user }: MarketingSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-icon.png"
            alt="OKrunit"
            width={36}
            height={36}
            className="size-9 object-contain"
            priority
          />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            OKrunit
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <HeroNav user={user} />
      </div>
    </header>
  );
}
