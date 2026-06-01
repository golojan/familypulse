import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { StoreProvider } from "@/store/StoreProvider";
import { buildMetadata, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase makes every relative OG/canonical URL resolve to an absolute
  // production URL (set NEXT_PUBLIC_SITE_URL in prod). See lib/seo.ts.
  metadataBase: new URL(siteUrl()),
  applicationName: SITE_NAME,
  ...buildMetadata({ path: "/" }),
  // "%s · FamilyPulse" for child pages; the default is the full brand line.
  // (Overrides the plain-string title from buildMetadata so child pages get the
  // template; the home page renders its own metadata below via the route.)
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
};

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
