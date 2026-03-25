import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/org/", "/settings/", "/admin/", "/approve/", "/reject/"],
      },
    ],
    sitemap: "https://okrunit.com/sitemap.xml",
  };
}
