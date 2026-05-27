import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyPulse — Healthy Families. Stronger Together.",
  description: "Family education blog and podcast for couples, parenting, relationships, discipline and work-life balance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
