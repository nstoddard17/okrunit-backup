"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailPreview {
  id: string;
  name: string;
  description: string;
  html: string;
}

export function EmailPreviewClient() {
  const [previews, setPreviews] = useState<EmailPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/v1/admin/email-previews");
      if (res.ok) {
        const data = await res.json();
        setPreviews(data.previews);
        if (data.previews.length > 0) {
          setSelected(data.previews[0].id);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const activePreview = previews.find((p) => p.id === selected);

  if (loading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-[28px] border border-border/60 bg-white shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading email previews...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-152px)] flex-col gap-6 xl:flex-row">
      <aside className="w-full shrink-0 overflow-hidden rounded-[28px] border border-border/60 bg-white shadow-[var(--shadow-card)] xl:w-[320px]">
        <div className="bg-[linear-gradient(135deg,var(--sidebar-gradient-from),var(--sidebar-gradient-to))] px-5 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
            <Sparkles className="size-3.5" />
            Internal QA
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Email previews</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Review every transactional email in the refreshed OKRunit shell and switch between desktop and mobile framing.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                Templates
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{previews.length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                Preview Mode
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {viewport === "desktop" ? "Desktop" : "Mobile"}
              </p>
            </div>
          </div>
        </div>
        <div className="max-h-[52vh] space-y-2 overflow-y-auto p-3 xl:max-h-[calc(100vh-320px)]">
          {previews.map((preview) => (
            <button
              key={preview.id}
              onClick={() => setSelected(preview.id)}
              className={cn(
                "w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition-all",
                selected === preview.id
                  ? "border-primary/25 bg-primary/[0.08] shadow-[var(--shadow-card)]"
                  : "border-transparent text-foreground hover:border-border/60 hover:bg-muted/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold tracking-tight",
                      selected === preview.id ? "text-primary" : "text-foreground",
                    )}
                  >
                    {preview.name}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {preview.description}
                  </p>
                </div>
                <CheckCircle2
                  className={cn(
                    "mt-0.5 size-4 shrink-0 transition-opacity",
                    selected === preview.id ? "opacity-100 text-primary" : "opacity-0",
                  )}
                />
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {activePreview && (
          <>
            <div className="rounded-[28px] border border-border/60 bg-white px-6 py-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <Mail className="size-3.5" />
                    Transactional Template
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {activePreview.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {activePreview.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-primary" />
                    Live HTML Preview
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background p-1 shadow-[var(--shadow-card)]">
                    <button
                      onClick={() => setViewport("desktop")}
                      className={cn(
                        "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                        viewport === "desktop"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Desktop view"
                    >
                      <span className="flex items-center gap-2">
                        <Monitor className="size-3.5" />
                        Desktop
                      </span>
                    </button>
                    <button
                      onClick={() => setViewport("mobile")}
                      className={cn(
                        "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                        viewport === "mobile"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Mobile view"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="size-3.5" />
                        Mobile
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-[32px] border border-border/60 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.12),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4 shadow-[var(--shadow-xl)]">
              <div className="flex h-full flex-col rounded-[28px] border border-white/80 bg-white/70 p-3 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between rounded-[20px] border border-border/60 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-red-400" />
                    <span className="size-2.5 rounded-full bg-amber-400" />
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-sm font-medium text-foreground">
                      OKRunit Email Renderer
                    </span>
                  </div>
                  <div className="hidden rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground sm:block">
                    {viewport === "desktop" ? "1366px preview" : "390px preview"}
                  </div>
                </div>

                <div className="flex-1 overflow-auto rounded-[24px] border border-black/5 bg-white/40 p-4">
                  <div
                    className={cn(
                      "mx-auto overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)] transition-all duration-300",
                      viewport === "desktop" ? "w-full max-w-[760px]" : "w-[390px] max-w-full",
                    )}
                  >
                    <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                      <span className="size-2.5 rounded-full bg-red-300" />
                      <span className="size-2.5 rounded-full bg-amber-300" />
                      <span className="size-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-xs font-medium text-zinc-500">
                        preview.html
                      </span>
                    </div>
                    <iframe
                      srcDoc={activePreview.html}
                      className="w-full border-0 bg-white"
                      style={{ height: viewport === "desktop" ? "980px" : "820px" }}
                      title={`Preview: ${activePreview.name}`}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
