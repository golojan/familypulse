import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { auth } from "@/auth";
import { UserRoleForm } from "@/components/user-role-form";
import { prisma } from "@/lib/prisma";

const PER_PAGE = 12;

export const metadata = {
  title: "User Management · FamilyPulse",
};

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard/users");
  }
  if (!session.user.roles?.includes("SUPERADMIN")) {
    return <SuperadminRequired />;
  }

  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [totalUsers, editorCount, superadminCount, filteredCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { roles: { has: "EDITOR" } } }),
    prisma.user.count({ where: { roles: { has: "SUPERADMIN" } } }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / PER_PAGE));
  const page = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );
  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      createdAt: true,
    },
  });

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-fp-green">
              Superadmin
            </p>
            <h1 className="mt-1 text-3xl font-bold">User management</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-fp-muted">
              Find FamilyPulse accounts and assign one or more roles. Changes take effect the next
              time the account&apos;s session is loaded.
            </p>
          </div>
          <form action="/dashboard/users" className="flex w-full max-w-sm items-center gap-2">
            <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-fp-line bg-white px-3 shadow-soft focus-within:ring-4 focus-within:ring-fp-green/15">
              <Search className="h-4 w-4 shrink-0 text-fp-green" />
              <span className="sr-only">Search users</span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search name or email"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 rounded-md bg-fp-green px-4 text-sm font-extrabold !text-white shadow-green"
            >
              Search
            </button>
          </form>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="User statistics">
          <StatCard icon={UsersRound} label="Total users" value={totalUsers} />
          <StatCard icon={ShieldCheck} label="Editors" value={editorCount} />
          <StatCard icon={ShieldAlert} label="Superadmins" value={superadminCount} />
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-fp-ink">
            {query
              ? `${filteredCount} result${filteredCount === 1 ? "" : "s"} for "${query}"`
              : "All users"}
          </p>
          {query ? (
            <Link
              href="/dashboard/users"
              className="text-xs font-extrabold text-fp-green hover:underline"
            >
              Clear search
            </Link>
          ) : null}
        </div>

        {users.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-fp-line bg-white/60 p-10 text-center">
            <UserRound className="mx-auto h-8 w-8 text-fp-muted" />
            <h2 className="mt-3 text-lg font-bold">No users found</h2>
            <p className="mt-1 text-sm font-semibold text-fp-muted">
              Try a different name or email address.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4">
            {users.map((user) => {
              const isCurrentUser = user.id === session.user.id;

              return (
                <li
                  key={user.id}
                  className="rounded-lg border border-fp-line bg-white p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fp-mint text-fp-green">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-base font-bold text-fp-ink">
                            {user.name ?? "FamilyPulse user"}
                          </h2>
                          {isCurrentUser ? (
                            <span className="rounded-full bg-fp-green/10 px-2 py-0.5 text-[11px] font-extrabold text-fp-green">
                              You
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-sm font-semibold text-fp-muted">
                          {user.email ?? "No email address"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-fp-muted">
                      Joined {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <UserRoleForm userId={user.id} roles={user.roles} isCurrentUser={isCurrentUser} />
                </li>
              );
            })}
          </ul>
        )}

        <Pager page={page} totalPages={totalPages} query={query} />
      </div>
    </main>
  );
}

function SuperadminRequired() {
  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-lg rounded-lg border border-fp-line bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Superadmin only</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
          User accounts and roles can only be managed by a FamilyPulse superadmin.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-fp-line bg-white p-4 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-fp-mint text-fp-green">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-fp-ink">{value}</p>
        <p className="text-xs font-extrabold uppercase tracking-wide text-fp-muted">{label}</p>
      </div>
    </div>
  );
}

function Pager({ page, totalPages, query }: { page: number; totalPages: number; query: string }) {
  if (totalPages <= 1) return null;

  const href = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(targetPage));
    return `/dashboard/users?${params.toString()}`;
  };

  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="User pagination">
      <PagerLink href={href(page - 1)} disabled={page === 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PagerLink>
      <span className="text-sm font-extrabold text-fp-muted">
        Page {page} of {totalPages}
      </span>
      <PagerLink href={href(page + 1)} disabled={page === totalPages} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PagerLink>
    </nav>
  );
}

function PagerLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="grid h-9 w-9 place-items-center rounded-md border border-fp-line bg-white text-fp-muted/40"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-md border border-fp-line bg-white text-fp-muted hover:border-fp-green hover:text-fp-green"
    >
      {children}
    </Link>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
