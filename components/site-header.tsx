import { ChevronDown, Menu, Search } from "lucide-react";
import { AuthButton } from "./auth-button";
import { Logo } from "./logo";

const navItems = [
  { label: "Articles", href: "#articles", menu: true },
  { label: "Podcast", href: "#podcast" },
  { label: "Videos", href: "#videos" },
  { label: "Parenting", href: "/topics/parenting-discipline", menu: true },
  { label: "Couples", href: "/topics/marriage-relationships", menu: true, wideOnly: true },
  { label: "Family Life", href: "/topics/family-activities", menu: true, wideOnly: true },
  { label: "Topics", href: "/topics", menu: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-fp-line/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1720px] items-center justify-between px-4 sm:px-8 lg:h-[78px]">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm font-extrabold text-fp-ink lg:flex 2xl:gap-8">
          <a
            className="relative text-fp-green after:absolute after:-bottom-6 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-fp-green"
            href="#"
          >
            Home
          </a>
          {navItems.map((item) => (
            <a
              key={item.label}
              className={`items-center gap-1 hover:text-fp-green ${item.wideOnly ? "hidden 2xl:inline-flex" : "inline-flex"}`}
              href={item.href}
            >
              {item.label} {item.menu ? <ChevronDown className="h-4 w-4" /> : null}
            </a>
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
          <button className="grid h-11 w-11 place-items-center rounded-md border border-fp-line bg-white text-fp-ink shadow-soft lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
