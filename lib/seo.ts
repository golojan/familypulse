import type { Metadata } from "next";

/**
 * Centralized SEO helpers: the canonical site URL, absolute-URL building, the
 * default OpenGraph/Twitter image set, and the shared metadata used as the base
 * for every page. Keeping this in one module means titles, descriptions, OG
 * tags, canonicals, and the sitemap all agree on the same origin and defaults.
 */

export const SITE_NAME = "FamilyPulse";
export const SITE_TAGLINE = "Healthy Families. Stronger Together.";
export const SITE_DESCRIPTION =
  "FamilyPulse is an evidence-based family publication — practical, research-backed guidance on parenting, relationships, child development, and wellbeing for families everywhere.";

/** Default OpenGraph images, rotated for site-wide pages. og-1 is the primary fallback. */
export const DEFAULT_OG_IMAGES = ["/og-imgs/og-1.png", "/og-imgs/og-2.png"] as const;

/**
 * The canonical origin (no trailing slash). Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL (set this in production, e.g. https://nupo.ng)
 *   2. VERCEL_URL (auto-set on Vercel deployments/previews)
 *   3. http://localhost:3000 (local dev)
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  return "http://localhost:3000";
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Build an absolute URL from a path (or pass through an already-absolute URL). */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl()}${path}`;
}

/** Absolute URLs for the rotating default OG images. */
export function defaultOgImageUrls(): string[] {
  return DEFAULT_OG_IMAGES.map((p) => absoluteUrl(p));
}

/**
 * Resolve the OG image(s) for a page. A post's cover image is preferred; when
 * it's missing we fall back to the rotating site defaults (og-1, og-2).
 */
export function resolveOgImages(cover?: string | null): string[] {
  const trimmed = cover?.trim();
  if (trimmed) return [absoluteUrl(trimmed), ...defaultOgImageUrls()];
  return defaultOgImageUrls();
}

/** JSON-LD for the site as a whole (home page): WebSite + Organization. */
export function websiteJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        potentialAction: {
          "@type": "SearchAction",
          target: `${url}/topics?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: SITE_NAME,
        url,
        logo: absoluteUrl("/icon.png"),
      },
    ],
  };
}

/** JSON-LD Article schema for a post page. */
export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  images: string[];
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: input.title,
    description: input.description,
    image: input.images,
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime ?? input.publishedTime,
    articleSection: input.section,
    author: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png") },
    },
  };
}

type PageMetaInput = {
  title?: string;
  description?: string;
  /** Path relative to the site root, e.g. "/topics". Used for canonical + og:url. */
  path?: string;
  images?: string[];
  type?: "website" | "article";
  /** Article-specific OpenGraph fields. */
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  /** Set true on non-indexable pages. */
  noindex?: boolean;
};

/**
 * Build a consistent Metadata object for a page: title/description, canonical,
 * OpenGraph + Twitter card. Pass only what differs from the site defaults.
 */
export function buildMetadata(input: PageMetaInput = {}): Metadata {
  const title = input.title ?? `${SITE_NAME} — ${SITE_TAGLINE}`;
  const description = input.description ?? SITE_DESCRIPTION;
  const path = input.path ?? "/";
  const url = absoluteUrl(path);
  const images = (
    input.images && input.images.length > 0 ? input.images : defaultOgImageUrls()
  ).map((image) => ({ url: image, width: 1200, height: 630, alt: title }));

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: input.type ?? "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images,
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            section: input.section,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}
