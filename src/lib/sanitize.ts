import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s",
  "ul", "ol", "li",
  "a",
  "code", "pre", "kbd",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "blockquote", "hr",
  "span", "div",
  "dl", "dt", "dd",
  "sub", "sup",
  "details", "summary",
];

const ALLOWED_ATTR = ["href", "class", "target", "rel"];

/**
 * Sanitize untrusted HTML content for safe rendering.
 * Strips all script tags, event handlers, and dangerous attributes.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
