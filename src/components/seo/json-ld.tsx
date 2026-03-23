export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OKRunit",
    url: "https://okrunit.com",
    logo: "https://okrunit.com/logo.png",
    description:
      "Universal approval gateway for AI agents and automation platforms.",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SoftwareAppJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OKRunit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://okrunit.com",
    description:
      "Human-in-the-loop approval gateway for AI agents and automation platforms. One API call pauses execution until a human approves.",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description:
          "3 connections, 100 approvals/month, email notifications",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "49",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description:
          "Unlimited connections and approvals, Slack notifications, rules engine, audit log",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "48",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OKRunit",
    url: "https://okrunit.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://okrunit.com/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FAQJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is OKRunit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OKRunit is a human-in-the-loop approval gateway for AI agents and automation platforms. It pauses automated workflows when they need to perform destructive or sensitive actions, notifies the right humans, and resumes execution after approval.",
        },
      },
      {
        "@type": "Question",
        name: "How does OKRunit work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your automation makes a single API call to OKRunit when it needs approval. OKRunit notifies the designated approvers via Slack, email, or push notifications. Once approved or rejected, OKRunit sends a webhook callback to your automation to continue or abort.",
        },
      },
      {
        "@type": "Question",
        name: "What platforms does OKRunit integrate with?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OKRunit integrates with Zapier, Make.com, n8n, Slack, GitHub Actions, Temporal, Prefect, Dagster, Windmill, Pipedream, and any platform that supports REST APIs or webhooks.",
        },
      },
      {
        "@type": "Question",
        name: "Is OKRunit free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, OKRunit has a free tier with 3 connections and 100 approvals per month. The Pro plan at $49/month includes unlimited connections, Slack notifications, rules engine, and audit logging.",
        },
      },
      {
        "@type": "Question",
        name: "Why do AI agents need human approval?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AI agents can make mistakes or take actions with irreversible consequences — deleting data, sending emails, deploying code, or making payments. Human-in-the-loop approval adds a safety layer so destructive actions only execute after a human reviews and approves them.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
