import { BookOpen, Home, Mic2, MoreHorizontal, Video } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: BookOpen, label: "Articles", href: "/#articles" },
  { icon: Mic2, label: "Podcast", href: "/#podcast" },
  { icon: Video, label: "Videos", href: "/#videos" },
  { icon: MoreHorizontal, label: "Topics", href: "/topics" },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-fp-line bg-white/95 px-4 py-2 shadow-[0_-12px_35px_rgba(9,55,24,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {navItems.map(({ icon: NavIcon, label, href }, index) => (
          <a key={label} className={`flex flex-col items-center justify-center rounded-md px-2 py-2 text-[11px] font-extrabold ${index === 0 ? "text-fp-green" : "text-fp-muted"}`} href={href}>
            <NavIcon className="mb-1 h-5 w-5" />
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
