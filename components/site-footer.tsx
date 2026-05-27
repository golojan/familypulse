import { Camera, Mail, MessageCircle, Music2, Video } from "lucide-react";
import { Logo } from "./logo";

const footerGroups = [
  {
    title: "Explore",
    links: ["Articles", "Podcast", "Videos", "About Us"],
  },
  {
    title: "Categories",
    links: ["Parenting", "Couples", "Family Life", "Work-Life Balance"],
  },
  {
    title: "Resources",
    links: ["Recommended Books", "Courses & Workshops", "Printables", "Community"],
  },
  {
    title: "Company",
    links: ["About Us", "Our Mission", "Contact", "Privacy Policy"],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-4 hidden border-t border-fp-line/80 bg-white/70 px-4 py-5 lg:block">
      <div className="mx-auto grid max-w-[1720px] gap-6 lg:grid-cols-[1.8fr_repeat(4,1fr)_1.4fr]">
        <div>
          <Logo />
          <p className="mt-2 text-xs font-semibold text-fp-muted">Healthy families. Stronger together.</p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-extrabold text-fp-ink">{group.title}</h3>
            <div className="mt-2 space-y-1">
              {group.links.map((link) => (
                <a key={link} className="block text-xs font-semibold text-fp-muted hover:text-fp-green" href="#">
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
        <div>
          <h3 className="text-xs font-extrabold text-fp-ink">Follow Us</h3>
          <div className="mt-3 flex gap-2 text-fp-green">
            {[MessageCircle, Camera, Video, Mail, Music2].map((Icon, index) => (
              <a key={index} className="grid h-7 w-7 place-items-center rounded-full bg-fp-mint" href="#">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-fp-muted">&copy; 2024 FamilyPulse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
