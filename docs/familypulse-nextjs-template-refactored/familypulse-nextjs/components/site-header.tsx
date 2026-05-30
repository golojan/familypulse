import { ChevronDown, Mail, Menu, Search } from "lucide-react";
import { Logo } from "./logo";

const navItems = ["Articles", "Parenting", "Couples", "Family Life", "About"];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-fp-line/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:h-[86px]">
        <Logo />

        <nav className="hidden items-center gap-7 text-sm font-black text-fp-ink lg:flex">
          <a
            className="relative text-fp-green after:absolute after:-bottom-7 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-fp-green"
            href="#"
          >
            Home
          </a>
          {navItems.map((item) => (
            <a key={item} className="inline-flex items-center gap-1 hover:text-fp-green" href="#">
              {item} <ChevronDown className="h-4 w-4" />
            </a>
          ))}
          <a className="hover:text-fp-green" href="#podcast">
            Podcast
          </a>
          <a className="hover:text-fp-green" href="#videos">
            Videos
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <label className="hidden h-12 w-[270px] items-center gap-2 rounded-2xl border border-fp-line bg-white px-4 text-sm font-semibold text-fp-muted shadow-soft xl:flex">
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search articles, podcast..."
            />
            <Search className="h-5 w-5 text-fp-green" />
          </label>
          <button className="grid h-11 w-11 place-items-center rounded-2xl border border-fp-line bg-white text-fp-ink shadow-soft xl:hidden">
            <Search className="h-5 w-5" />
          </button>
          <button className="hidden items-center gap-2 rounded-2xl bg-fp-green px-5 py-3 text-sm font-black text-white shadow-green sm:inline-flex">
            <Mail className="h-4 w-4" /> Subscribe
          </button>
          <button className="grid h-11 w-11 place-items-center rounded-2xl border border-fp-line bg-white text-fp-ink shadow-soft lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
