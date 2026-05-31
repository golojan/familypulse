import Script from "next/script";

/**
 * Site-wide Google AdSense Auto ads. Loads the AdSense loader script once
 * (per public page) with the site's publisher id. With Auto ads enabled in the
 * AdSense console, Google then places ads automatically across the page — no
 * per-slot markup needed.
 *
 * Rendered only on public pages (via PublicShell) and only when a publisher id
 * is configured and Auto ads is toggled on in Site Settings → Advertising.
 */
export function AutoAds({ clientId }: { clientId: string }) {
  return (
    <Script
      id="adsense-loader"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        clientId,
      )}`}
    />
  );
}
