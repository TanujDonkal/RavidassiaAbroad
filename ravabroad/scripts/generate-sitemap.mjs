import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://www.ravidassiaabroad.com";
const apiBase =
  process.env.REACT_APP_API_URL_PROD ||
  process.env.REACT_APP_API_URL_LOCAL ||
  "http://localhost:5000";

function xmlEscape(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toAbsoluteUrl(routePath) {
  if (!routePath || routePath === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildUrlEntry(entry) {
  const lastmod = normalizeDate(entry.updatedAt);
  const parts = [
    "  <url>",
    `    <loc>${xmlEscape(toAbsoluteUrl(entry.path))}</loc>`,
  ];

  if (lastmod) {
    parts.push(`    <lastmod>${lastmod}</lastmod>`);
  }

  if (entry.changefreq) {
    parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  }

  if (typeof entry.priority === "number") {
    parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  }

  parts.push("  </url>");
  return parts.join("\n");
}

async function main() {
  const response = await fetch(`${apiBase}/api/seo/sitemap`);
  if (!response.ok) {
    throw new Error(`Failed to load sitemap feed: ${response.status}`);
  }

  const data = await response.json();
  const routeMap = new Map();

  const addRoute = (entry) => {
    if (!entry?.path || routeMap.has(entry.path)) return;
    routeMap.set(entry.path, entry);
  };

  (data.staticRoutes || []).forEach((routePath) =>
    addRoute({
      path: routePath,
      changefreq: routePath === "/" ? "weekly" : "monthly",
      priority: routePath === "/" ? 1.0 : 0.7,
    })
  );

  (data.menus || []).forEach((menu) =>
    addRoute({
      path: menu.path,
      changefreq: "monthly",
      priority: 0.6,
    })
  );

  (data.blogs || []).forEach((blog) =>
    addRoute({
      path: blog.path,
      updatedAt: blog.updatedAt,
      changefreq: "weekly",
      priority: 0.8,
    })
  );

  (data.articles || []).forEach((article) =>
    addRoute({
      path: article.path,
      updatedAt: article.updatedAt,
      changefreq: "monthly",
      priority: 0.7,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...routeMap.values(),
  ]
    .map(buildUrlEntry)
    .join("\n")}\n</urlset>\n`;

  const outputPath = path.resolve("public", "sitemap.xml");
  await fs.writeFile(outputPath, xml, "utf8");
  console.log(`Sitemap generated at ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
