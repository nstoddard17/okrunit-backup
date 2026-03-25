// ---------------------------------------------------------------------------
// OKRunit -- Tests for HTML Sanitizer
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../sanitize";

// ---- Script tag stripping -------------------------------------------------

describe("sanitizeHtml - script tags", () => {
  it("strips <script> tags entirely", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips <script> tags with attributes", () => {
    const input = '<script src="https://evil.com/xss.js"></script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("evil.com");
  });

  it("strips nested script tags", () => {
    const input = '<div><script>document.cookie</script></div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("document.cookie");
    expect(result).toContain("<div>");
  });

  it("strips script tags with mixed case", () => {
    const input = '<ScRiPt>alert(1)</ScRiPt>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("alert");
  });
});

// ---- Event handler stripping ----------------------------------------------

describe("sanitizeHtml - event handlers", () => {
  it("strips onerror handler", () => {
    const input = '<img onerror="alert(1)" src="x">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });

  it("strips onclick handler", () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("alert");
    expect(result).toContain("Click me");
  });

  it("strips onmouseover handler", () => {
    const input = '<a onmouseover="steal()">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onmouseover");
    expect(result).not.toContain("steal");
  });

  it("strips onload handler", () => {
    const input = '<body onload="init()"><p>Content</p></body>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onload");
    expect(result).not.toContain("init()");
  });

  it("strips onfocus handler", () => {
    const input = '<input onfocus="alert(1)" autofocus>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onfocus");
  });
});

// ---- Allowed safe HTML tags -----------------------------------------------

describe("sanitizeHtml - allowed tags", () => {
  it("allows <p> tags", () => {
    const input = "<p>Paragraph text</p>";
    expect(sanitizeHtml(input)).toBe("<p>Paragraph text</p>");
  });

  it("allows <strong> and <em> tags", () => {
    const input = "<strong>Bold</strong> and <em>italic</em>";
    expect(sanitizeHtml(input)).toContain("<strong>Bold</strong>");
    expect(sanitizeHtml(input)).toContain("<em>italic</em>");
  });

  it("allows <b>, <i>, <u>, <s> tags", () => {
    const input = "<b>Bold</b><i>Italic</i><u>Underline</u><s>Strike</s>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<b>Bold</b>");
    expect(result).toContain("<i>Italic</i>");
    expect(result).toContain("<u>Underline</u>");
    expect(result).toContain("<s>Strike</s>");
  });

  it("allows <a> tags with href", () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain("<a");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain("Link</a>");
  });

  it("allows <a> tags with target and rel attributes", () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener"');
  });

  it("allows list tags", () => {
    const input = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    expect(sanitizeHtml(input)).toBe("<ul><li>Item 1</li><li>Item 2</li></ul>");
  });

  it("allows ordered lists", () => {
    const input = "<ol><li>First</li><li>Second</li></ol>";
    expect(sanitizeHtml(input)).toBe("<ol><li>First</li><li>Second</li></ol>");
  });

  it("allows code and pre tags", () => {
    const input = "<pre><code>const x = 1;</code></pre>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<pre>");
    expect(result).toContain("<code>");
    expect(result).toContain("const x = 1;");
  });

  it("allows heading tags h1-h6", () => {
    const input = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<h2>Subtitle</h2>");
    expect(result).toContain("<h3>Section</h3>");
  });

  it("allows table tags", () => {
    const input = "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<table>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<th>Header</th>");
    expect(result).toContain("<td>Cell</td>");
  });

  it("allows blockquote and hr", () => {
    const input = "<blockquote>Quote</blockquote><hr>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<blockquote>Quote</blockquote>");
    expect(result).toContain("<hr>");
  });

  it("allows <br> tags", () => {
    const input = "Line 1<br>Line 2";
    const result = sanitizeHtml(input);
    expect(result).toContain("<br>");
  });

  it("allows span and div tags", () => {
    const input = '<div><span class="highlight">Text</span></div>';
    const result = sanitizeHtml(input);
    expect(result).toContain("<div>");
    expect(result).toContain("<span");
    expect(result).toContain('class="highlight"');
  });

  it("allows details and summary tags", () => {
    const input = "<details><summary>More info</summary><p>Content here</p></details>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>More info</summary>");
  });

  it("allows description list tags", () => {
    const input = "<dl><dt>Term</dt><dd>Definition</dd></dl>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<dl>");
    expect(result).toContain("<dt>Term</dt>");
    expect(result).toContain("<dd>Definition</dd>");
  });

  it("allows sub and sup tags", () => {
    const input = "H<sub>2</sub>O and E=mc<sup>2</sup>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<sub>2</sub>");
    expect(result).toContain("<sup>2</sup>");
  });

  it("allows kbd tag", () => {
    const input = "Press <kbd>Ctrl</kbd>+<kbd>C</kbd>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<kbd>Ctrl</kbd>");
  });
});

// ---- Dangerous attribute stripping ----------------------------------------

describe("sanitizeHtml - dangerous attributes", () => {
  it("strips style attribute", () => {
    const input = '<p style="color: red; background: url(javascript:alert(1))">Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("style");
    expect(result).toContain("<p>Text</p>");
  });

  it("strips data-* attributes (ALLOW_DATA_ATTR: false)", () => {
    const input = '<div data-id="123" data-action="delete">Content</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("data-id");
    expect(result).not.toContain("data-action");
    expect(result).toContain("Content");
  });

  it("strips id attribute", () => {
    const input = '<div id="target">Content</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('id="target"');
  });

  it("strips form action attributes", () => {
    const input = '<form action="https://evil.com"><input type="submit"></form>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("form");
    expect(result).not.toContain("evil.com");
  });

  it("strips iframe tags entirely", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("evil.com");
  });

  it("strips object and embed tags", () => {
    const input = '<object data="evil.swf"></object><embed src="evil.swf">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<object");
    expect(result).not.toContain("<embed");
  });
});

// ---- Null/empty/edge case input -------------------------------------------

describe("sanitizeHtml - edge cases", () => {
  it("handles empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("handles whitespace-only string", () => {
    expect(sanitizeHtml("   ")).toBe("   ");
  });

  it("handles plain text without HTML", () => {
    const input = "Just plain text with no HTML tags";
    expect(sanitizeHtml(input)).toBe(input);
  });

  it("handles already-escaped HTML entities", () => {
    const input = "&lt;script&gt;alert(1)&lt;/script&gt;";
    const result = sanitizeHtml(input);
    // Should remain escaped, not become executable
    expect(result).not.toContain("<script>");
  });

  it("handles javascript: protocol in href", () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("handles deeply nested malicious content", () => {
    const input = '<div><div><div><script>alert(1)</script></div></div></div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script");
    expect(result).toContain("<div>");
  });

  it("handles SVG-based XSS vectors", () => {
    const input = '<svg onload="alert(1)"><circle r="10"/></svg>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onload");
    expect(result).not.toContain("alert");
  });
});
