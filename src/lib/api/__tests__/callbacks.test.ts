// ---------------------------------------------------------------------------
// OKrunit -- Tests for SSRF Protection (isPrivateUrl)
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { isPrivateUrl } from "../ssrf";

// ---- Blocked: localhost variants ------------------------------------------

describe("isPrivateUrl - localhost", () => {
  it("blocks localhost", () => {
    expect(isPrivateUrl("https://localhost/callback")).toBe(true);
  });

  it("blocks localhost with port", () => {
    expect(isPrivateUrl("https://localhost:3000/callback")).toBe(true);
  });

  it("blocks 127.0.0.1", () => {
    expect(isPrivateUrl("https://127.0.0.1/callback")).toBe(true);
  });

  it("blocks 127.0.0.1 with port", () => {
    expect(isPrivateUrl("http://127.0.0.1:8080/api")).toBe(true);
  });

  it("blocks any 127.x.x.x address", () => {
    expect(isPrivateUrl("https://127.0.0.2/callback")).toBe(true);
    expect(isPrivateUrl("https://127.255.255.255/callback")).toBe(true);
  });

  it("blocks IPv6 loopback ::1", () => {
    expect(isPrivateUrl("https://[::1]/callback")).toBe(true);
  });
});

// ---- Blocked: private IP ranges ------------------------------------------

describe("isPrivateUrl - private IP ranges", () => {
  it("blocks 10.0.0.0/8 (Class A private)", () => {
    expect(isPrivateUrl("https://10.0.0.1/callback")).toBe(true);
    expect(isPrivateUrl("https://10.255.255.255/callback")).toBe(true);
    expect(isPrivateUrl("https://10.1.2.3/callback")).toBe(true);
  });

  it("blocks 172.16.0.0/12 (Class B private)", () => {
    expect(isPrivateUrl("https://172.16.0.1/callback")).toBe(true);
    expect(isPrivateUrl("https://172.31.255.255/callback")).toBe(true);
    expect(isPrivateUrl("https://172.20.0.1/callback")).toBe(true);
  });

  it("allows 172.x outside the 16-31 range", () => {
    expect(isPrivateUrl("https://172.15.0.1/callback")).toBe(false);
    expect(isPrivateUrl("https://172.32.0.1/callback")).toBe(false);
  });

  it("blocks 192.168.0.0/16 (Class C private)", () => {
    expect(isPrivateUrl("https://192.168.0.1/callback")).toBe(true);
    expect(isPrivateUrl("https://192.168.1.1/callback")).toBe(true);
    expect(isPrivateUrl("https://192.168.255.255/callback")).toBe(true);
  });

  it("blocks 169.254.0.0/16 (link-local / cloud metadata)", () => {
    expect(isPrivateUrl("https://169.254.0.1/callback")).toBe(true);
    expect(isPrivateUrl("https://169.254.169.254/latest/meta-data/")).toBe(true);
  });

  it("blocks 0.0.0.0/8", () => {
    expect(isPrivateUrl("https://0.0.0.0/callback")).toBe(true);
    expect(isPrivateUrl("https://0.0.0.1/callback")).toBe(true);
  });
});

// ---- Blocked: special hostnames -------------------------------------------

describe("isPrivateUrl - special hostnames", () => {
  it("blocks 0.0.0.0", () => {
    expect(isPrivateUrl("https://0.0.0.0/callback")).toBe(true);
  });

  it("blocks .local domains", () => {
    expect(isPrivateUrl("https://myserver.local/callback")).toBe(true);
    expect(isPrivateUrl("https://printer.local:9100/api")).toBe(true);
  });

  it("blocks metadata.google.internal", () => {
    expect(isPrivateUrl("https://metadata.google.internal/computeMetadata/v1/")).toBe(true);
  });
});

// ---- Blocked: invalid URLs ------------------------------------------------

describe("isPrivateUrl - invalid URLs", () => {
  it("blocks completely invalid URL", () => {
    expect(isPrivateUrl("not-a-url")).toBe(true);
  });

  it("blocks empty string", () => {
    expect(isPrivateUrl("")).toBe(true);
  });

  it("blocks non-http/https protocols", () => {
    expect(isPrivateUrl("ftp://example.com/callback")).toBe(true);
    expect(isPrivateUrl("file:///etc/passwd")).toBe(true);
    expect(isPrivateUrl("gopher://example.com")).toBe(true);
  });
});

// ---- Allowed: valid public URLs -------------------------------------------

describe("isPrivateUrl - allowed public URLs", () => {
  it("allows valid HTTPS public URLs", () => {
    expect(isPrivateUrl("https://example.com/callback")).toBe(false);
    expect(isPrivateUrl("https://api.stripe.com/webhooks")).toBe(false);
    expect(isPrivateUrl("https://hooks.slack.com/services/123")).toBe(false);
  });

  it("allows valid HTTP public URLs", () => {
    expect(isPrivateUrl("http://example.com/callback")).toBe(false);
  });

  it("allows public IPs", () => {
    expect(isPrivateUrl("https://8.8.8.8/callback")).toBe(false);
    expect(isPrivateUrl("https://1.1.1.1/callback")).toBe(false);
    expect(isPrivateUrl("https://203.0.113.1/callback")).toBe(false);
  });

  it("allows URLs with paths and query strings", () => {
    expect(isPrivateUrl("https://api.example.com/v1/webhook?key=abc")).toBe(false);
  });

  it("allows URLs with ports on public domains", () => {
    expect(isPrivateUrl("https://example.com:8443/callback")).toBe(false);
  });

  it("allows subdomains of public domains", () => {
    expect(isPrivateUrl("https://webhook.site/some-uuid")).toBe(false);
    expect(isPrivateUrl("https://hooks.zapier.com/hooks/catch/123")).toBe(false);
  });
});
