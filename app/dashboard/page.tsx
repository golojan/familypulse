import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, PenLine, Plus } from "lucide-react";
import { auth } from "@/auth";
import { listPostsPage, type PostListItem, type PostStatusFilter } from "@/lib/posts-data";
import { PostRowActions } from "@/components/post-row-actions";

const CAN_MANAGE_ROLES = ["EDITOR", "SUPERADMIN"];
const PER_PAGE = 10;

export const metadata = {
  title: "Dashboard · FamilyPulse",
};

function parseStatus(value: string | undefined): PostStatusFilter {
  return value === "DRAFT" || value === "PUBLISHED" ? value : "ALL";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  const canManage = session.user.roles?.some((r) => CAN_MANAGE_ROLES.includes(r));
  if (!canManage) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 font-sans text-fp-ink">
        <div className="mx-auto max-w-lg rounded-lg border border-fp-line bg-white p-8 text-center shadow-card">
          <h1 className="text-2xl font-bold">No editor access</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
            Your account doesn&apos;t have permission to manage posts. Ask a FamilyPulse
            administrator for editor access.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const data = await listPostsPage(session.user.id, {
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    perPage: PER_PAGE,
    status,
  });

  const tabs: Array<{ key: PostStatusFilter; label: string; count: number }> = [
    { key: "ALL", label: "All", count: data.draftCount + data.publishedCount },
    { key: "DRAFT", label: "Drafts", count: data.draftCount },
    { key: "PUBLISHED", label: "Published", count: data.publishedCount },
  ];

  const hasAnyPosts = data.draftCount + data.publishedCount > 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8 font-sans text-fp-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-fp-green">
              FamilyPulse
            </p>
            <h1 className="mt-1 text-3xl font-bold">Your posts</h1>
            <p className="mt-2 text-sm font-semibold text-fp-muted">
              {data.publishedCount} published · {data.draftCount} draft
              {data.draftCount === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-2 rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
          >
            <Plus className="h-4 w-4" /> New post
          </Link>
        </header>

        {!hasAnyPosts ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid gap-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.key === "ALL" ? "/dashboard" : `/dashboard?status=${tab.key}`}
                  className={`rounded-md px-3 py-2 text-xs font-extrabold ${
                    status === tab.key
                      ? "bg-fp-green text-white"
                      : "border border-fp-line bg-white text-fp-muted hover:border-fp-green hover:text-fp-green"
                  }`}
                >
                  {tab.label} ({tab.count})
                </Link>
              ))}
            </div>

            {data.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-fp-line bg-white/60 px-4 py-6 text-sm font-semibold text-fp-muted">
                Nothing here yet.
              </p>
            ) : (
              <ul className="grid gap-3">
                {data.items.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ul>
            )}

            <Pager page={data.page} totalPages={data.totalPages} status={status} />
          </div>
        )}
      </div>
    </main>
  );
}

function Pager({
  page,
  totalPages,
  status,
}: {
  page: number;
  totalPages: number;
  status: PostStatusFilter;
}) {
  if (totalPages <= 1) return null;
  const base = status === "ALL" ? "" : `status=${status}&`;
  const href = (p: number) => `/dashboard?${base}page=${p}`;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-2 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PagerLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PagerLink>
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm font-extrabold ${
            p === page
              ? "bg-fp-green text-white"
              : "border border-fp-line bg-white text-fp-muted hover:border-fp-green hover:text-fp-green"
          }`}
        >
          {p}
        </Link>
      ))}
      <PagerLink href={href(page + 1)} disabled={page >= totalPages} label="Next page">
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

function PostRow({ post }: { post: PostListItem }) {
  const dateLabel =
    post.status === "PUBLISHED" && post.publishedAt
      ? `Published ${formatDate(post.publishedAt)}`
      : `Edited ${formatDate(post.updatedAt)}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-fp-line bg-white p-4 shadow-soft">
      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/posts/${post.id}/edit`}
          className="flex items-center gap-2 text-base font-bold text-fp-ink hover:text-fp-green"
        >
          <FileText className="h-4 w-4 shrink-0 text-fp-muted" />
          <span className="truncate">{post.title || "Untitled post"}</span>
        </Link>
        {post.excerpt ? (
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-fp-muted">{post.excerpt}</p>
        ) : null}
        <p className="mt-1 text-xs font-bold text-fp-muted">
          {post.topicTitle ? `${post.topicTitle} · ` : ""}
          {dateLabel}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/posts/${post.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border border-fp-line bg-white px-3 py-1.5 text-xs font-extrabold text-fp-ink hover:border-fp-green hover:text-fp-green"
        >
          <PenLine className="h-3.5 w-3.5" /> Edit
        </Link>
        <PostRowActions postId={post.id} status={post.status} />
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-lg border border-dashed border-fp-line bg-white/60 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fp-green/10 text-fp-green">
        <PenLine className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold">Write your first post</h2>
      <p className="mt-2 text-sm font-semibold text-fp-muted">
        Build it block by block — headings, paragraphs, quotes, lists, and images.
      </p>
      <Link
        href="/dashboard/posts/new"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
      >
        <Plus className="h-4 w-4" /> New post
      </Link>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
