import type { ReactNode } from "react";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/**
 * Shared chrome for every public page: the public navbar (SiteHeader), footer,
 * and mobile bottom nav. Pass `rail` to get a two-column layout with a sticky
 * right-side rail (ads, similar/popular posts, newsletter) on listing and
 * article pages; omit it for full-width pages.
 */
export function PublicShell({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24 font-sans text-fp-ink lg:pb-0">
      <SiteHeader />

      {rail ? (
        <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">{children}</div>
          <div className="min-w-0">{rail}</div>
        </div>
      ) : (
        children
      )}

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
