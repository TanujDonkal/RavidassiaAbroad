import DOMPurify from "dompurify";

export const RICH_CONTENT_SANITIZE_OPTIONS = {
  FORBID_TAGS: ["style", "font"],
  FORBID_ATTR: ["style", "bgcolor", "color", "face"],
};

export function sanitizeRichContent(html = "") {
  return DOMPurify.sanitize(html, RICH_CONTENT_SANITIZE_OPTIONS);
}
