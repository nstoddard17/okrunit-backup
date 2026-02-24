import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light flex min-h-svh bg-white text-zinc-950" style={{ colorScheme: "light" }}>
      {/* Left branding panel -- hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-50 p-12">
        <Image src="/logo_text.png" alt="Gatekeeper" width={220} height={165} />

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed text-zinc-900">
              &ldquo;Gatekeeper saved us from a catastrophic automated
              deployment. One approval click was all it took.&rdquo;
            </p>
            <footer className="text-sm text-zinc-500">
              &mdash; Engineering Lead, Series B Startup
            </footer>
          </blockquote>
        </div>

        <p className="text-xs text-zinc-500">
          Human-in-the-loop approval for every automation.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Image src="/logo_text.png" alt="Gatekeeper" width={160} height={120} />
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
