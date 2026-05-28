import Link from "next/link";
import { Bot, FileText, Home, Images, Plus } from "lucide-react";
import { auth } from "@/auth";

const CAN_MANAGE = ["EDITOR", "SUPERADMIN"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  const canManage = roles.some((role) => CAN_MANAGE.includes(role));

  return (
    <section className="min-h-screen bg-background font-sans text-fp-ink">
      <header className="sticky top-0 z-40 border-b border-fp-line/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1720px] items-center justify-between px-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-fp-green">
            <Home className="h-4 w-4" />
            FamilyPulse
          </Link>

          <nav className="flex items-center gap-2 text-sm font-extrabold text-fp-ink sm:gap-4">
            <Link className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 hover:bg-fp-mint hover:text-fp-green" href="/dashboard">
              <FileText className="h-4 w-4" />
              Posts
            </Link>
            {canManage ? (
              <Link className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 hover:bg-fp-mint hover:text-fp-green" href="/dashboard/media">
                <Images className="h-4 w-4" />
                Media
              </Link>
            ) : null}
            {roles.includes("SUPERADMIN") ? (
              <Link className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 hover:bg-fp-mint hover:text-fp-green" href="/dashboard/pulse-ai">
                <Bot className="h-4 w-4" />
                Pulse AI
              </Link>
            ) : null}
          </nav>

          {canManage ? (
            <Link className="hidden items-center gap-2 rounded-md bg-fp-green px-4 py-3 text-sm font-extrabold !text-white shadow-green sm:inline-flex" href="/dashboard/posts/new">
              <Plus className="h-4 w-4" />
              New Post
            </Link>
          ) : (
            <span className="hidden text-xs font-bold text-fp-muted sm:block">Reader</span>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
