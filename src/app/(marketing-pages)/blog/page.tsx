import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - OKrunit",
  description: "Insights on human-in-the-loop approvals, automation safety, and workflow best practices.",
  alternates: { canonical: "https://okrunit.com/blog" },
};

const POSTS = [
  {
    slug: "why-ai-agents-need-human-approval",
    title: "Why AI Agents Need Human Approval",
    description: "AI agents are powerful but fallible. Here's why adding human checkpoints to autonomous workflows prevents costly mistakes and builds trust.",
    date: "2026-03-28",
    readTime: "5 min read",
    category: "AI Safety",
  },
  {
    slug: "approval-workflows-in-zapier",
    title: "How to Add Approval Workflows to Zapier",
    description: "Step-by-step guide to pausing your Zapier Zaps for human review before they execute critical actions.",
    date: "2026-03-25",
    readTime: "4 min read",
    category: "Guides",
  },
  {
    slug: "preventing-automation-mistakes",
    title: "Preventing Costly Automation Mistakes with Human Review",
    description: "Real examples of automation failures that could have been prevented with a simple approval step. Learn from others' mistakes.",
    date: "2026-03-20",
    readTime: "6 min read",
    category: "Best Practices",
  },
  {
    slug: "sso-and-compliance-for-approval-workflows",
    title: "SSO and Compliance for Approval Workflows",
    description: "How to set up SSO/SAML, audit logging, and data retention policies for enterprise compliance requirements.",
    date: "2026-03-15",
    readTime: "7 min read",
    category: "Enterprise",
  },
  {
    slug: "announcing-okrunit-v1",
    title: "Announcing OKrunit v1.0",
    description: "After months of development and beta testing, OKrunit is officially live. Here's what we built and why.",
    date: "2026-03-10",
    readTime: "3 min read",
    category: "Announcements",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "AI Safety": "bg-red-50 text-red-700",
  "Guides": "bg-blue-50 text-blue-700",
  "Best Practices": "bg-emerald-50 text-emerald-700",
  "Enterprise": "bg-violet-50 text-violet-700",
  "Announcements": "bg-amber-50 text-amber-700",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Blog</h1>
          <p className="mt-2 text-lg text-zinc-600">
            Insights on human-in-the-loop approvals, automation safety, and workflow best practices.
          </p>
        </div>

        <div className="space-y-8">
          {POSTS.map((post) => (
            <article key={post.slug} className="group">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-zinc-100 text-zinc-600"}`}>
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Calendar className="size-3" />
                  {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <span className="text-xs text-zinc-400">{post.readTime}</span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-zinc-600 leading-relaxed">
                {post.description}
              </p>
              <Link href="/docs/changelog" className="mt-3 text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                Read on changelog <ArrowRight className="size-3" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-zinc-50 p-8 text-center">
          <h3 className="text-lg font-semibold text-zinc-900">Stay updated</h3>
          <p className="mt-2 text-sm text-zinc-600">
            New posts are announced on our{" "}
            <Link href="/docs/changelog" className="text-primary hover:underline">
              changelog
            </Link>
            . Follow us for updates on automation safety and workflow best practices.
          </p>
        </div>
      </div>
    </div>
  );
}
