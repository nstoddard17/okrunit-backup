import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      {/* Left branding panel -- hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-muted p-12">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Gatekeeper" width={48} height={48} />
          <span className="text-xl font-bold">Gatekeeper</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;Gatekeeper saved us from a catastrophic automated
              deployment. One approval click was all it took.&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">
              &mdash; Engineering Lead, Series B Startup
            </footer>
          </blockquote>
        </div>

        <p className="text-xs text-muted-foreground">
          Human-in-the-loop approval for every automation.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Image src="/logo.png" alt="Gatekeeper" width={36} height={36} />
          <span className="text-lg font-bold">Gatekeeper</span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
