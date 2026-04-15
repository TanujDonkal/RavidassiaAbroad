import { useEffect } from "react";
import {
  buildCanonicalUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
} from "../utils/seo";

function setMetaTag({ name, property, content }) {
  if (!content) return;

  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;
  let meta = document.head.querySelector(selector);

  if (!meta) {
    meta = document.createElement("meta");
    if (name) {
      meta.setAttribute("name", name);
    }
    if (property) {
      meta.setAttribute("property", property);
    }
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function setLinkTag({ rel, href }) {
  if (!href) return;

  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  robots = "index,follow",
  structuredData,
}) {
  useEffect(() => {
    const canonicalUrl = buildCanonicalUrl(canonicalPath);
    const resolvedTitle = title || SITE_NAME;

    document.title = resolvedTitle;
    setMetaTag({ name: "description", content: description });
    setMetaTag({ name: "robots", content: robots });
    setMetaTag({ property: "og:type", content: type });
    setMetaTag({ property: "og:site_name", content: SITE_NAME });
    setMetaTag({ property: "og:title", content: resolvedTitle });
    setMetaTag({ property: "og:description", content: description });
    setMetaTag({ property: "og:url", content: canonicalUrl });
    setMetaTag({ property: "og:image", content: image });
    setMetaTag({ name: "twitter:card", content: "summary_large_image" });
    setMetaTag({ name: "twitter:title", content: resolvedTitle });
    setMetaTag({ name: "twitter:description", content: description });
    setMetaTag({ name: "twitter:image", content: image });
    setLinkTag({ rel: "canonical", href: canonicalUrl });

    const scriptId = "seo-structured-data";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const jsonLd = Array.isArray(structuredData)
        ? structuredData
        : [structuredData];
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [canonicalPath, description, image, robots, structuredData, title, type]);

  return null;
}
