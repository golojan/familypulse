import Link from "next/link";
import { Bot, FileText, Images, Search } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { AuthButton } from "@/components/auth-button";

const CAN_MANAGE = ["EDITOR", "SUPERADMIN"];

// Dashboard navigation, gated by role. Mirrors the public site header template
// (same Logo, search, and AuthButton with the New Post action + avatar menu);
// only these menu items differ from the public nav.
type DashNavItem = { label: string; href: string; icon: typeof FileText; roles?: string[] };

const DASH_NAV: DashNavItem[] = [
  { label: "Posts", href: "/dashboard", icon: FileText },
  { label: "Media", href: "/dashboard/media", icon: Images, roles: CAN_MANAGE },
  { label: "Pulse AI", href: "/dashboard/pulse-ai", icon: Bot, roles: ["SUPERADMIN"] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  const items = DASH_NAV.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r)));

  return (
    <section className="min-h-screen bg-background font-sans text-fp-ink">
      <header className="sticky top-0 z-50 border-b border-fp-line/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1720px] items-center justify-between px-4 sm:px-8 lg:h-[78px]">
          <Link href="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-extrabold text-fp-ink lg:flex 2xl:gap-8">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 hover:text-fp-green"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden h-12 w-[260px] items-center gap-2 rounded-md border border-fp-line bg-white px-4 text-sm font-semibold text-fp-muted shadow-soft 2xl:flex">
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Search articles, podcast..."
              />
              <Search className="h-5 w-5 text-fp-green" />
            </label>
            <button className="grid h-11 w-11 place-items-center rounded-md border border-fp-line bg-white text-fp-ink shadow-soft 2xl:hidden">
              <Search className="h-5 w-5" />
            </button>
            <AuthButton />
          </div>
        </div>

        {/* Compact role-gated nav for small screens, where the main nav is hidden. */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-fp-line/70 px-4 py-2 text-sm font-extrabold text-fp-ink lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 hover:bg-fp-mint hover:text-fp-green"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </section>
  );
}
