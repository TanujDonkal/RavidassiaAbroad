export const SITE_NAME = "Ravidassia Abroad";
export const SITE_URL = "https://www.ravidassiaabroad.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo512.png`;
export const DEFAULT_DESCRIPTION =
  "Ravidassia Abroad connects the global Ravidassia community through history, teachings, blogs, temples, student support, matrimony, and cultural resources.";

export function buildCanonicalUrl(pathname = "/") {
  if (!pathname) return SITE_URL;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value = "", maxLength = 160) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}
