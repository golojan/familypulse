import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { StoreProvider } from "@/store/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyPulse - Healthy Families. Stronger Together.",
  description:
    "Family education blog and podcast for couples, parenting, relationships, discipline and work-life balance.",
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
