import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Images, PenLine, Plus, Settings } from "lucide-react";
import { auth } from "@/auth";
import { listPostsByAuthor, type PostListItem } from "@/lib/posts-data";
import { PostRowActions } from "@/components/post-row-actions";

const CAN_MANAGE_ROLES = ["EDITOR", "SUPERADMIN"];

export const metadata = {
  title: "Dashboard · FamilyPulse",
};

export default async function DashboardPage() {
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

  const isSuperadmin = session.user.roles?.includes("SUPERADMIN");
  const posts = await listPostsByAuthor(session.user.id);
  const drafts = posts.filter((p) => p.status === "DRAFT");
  const published = posts.filter((p) => p.status === "PUBLISHED");

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
              {published.length} published · {drafts.length} draft
              {drafts.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-2 rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
          >
            <Plus className="h-4 w-4" /> New post
          </Link>
          <Link
            href="/dashboard/media"
            className="inline-flex items-center gap-2 rounded-md border border-fp-line bg-white px-5 py-3 text-sm font-extrabold text-fp-ink shadow-soft"
          >
            <Images className="h-4 w-4" /> Media
          </Link>
          {isSuperadmin ? (
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 rounded-md border border-fp-line bg-white px-5 py-3 text-sm font-extrabold text-fp-ink shadow-soft"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
          ) : null}
        </header>

        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid gap-8">
            <PostSection title="Drafts" posts={drafts} emptyHint="No drafts in progress." />
            <PostSection title="Published" posts={published} emptyHint="Nothing published yet." />
          </div>
        )}
      </div>
    </main>
  );
}

function PostSection({
  title,
  posts,
  emptyHint,
}: {
  title: string;
  posts: PostListItem[];
  emptyHint: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      {posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-fp-line bg-white/60 px-4 py-6 text-sm font-semibold text-fp-muted">
          {emptyHint}
        </p>
      ) : (
        <ul className="grid gap-3">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </ul>
      )}
    </section>
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
