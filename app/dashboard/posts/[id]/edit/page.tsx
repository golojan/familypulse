import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getPostForEditor } from "@/lib/posts-data";
import { listTopicsForEditor } from "@/lib/topics-data";
import { PostEditor } from "@/components/post-editor";

const CAN_MANAGE_ROLES = ["EDITOR", "SUPERADMIN"];

export const metadata = {
  title: "Edit post · FamilyPulse",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/dashboard/posts/${id}/edit`);
  }
  const canManage = session.user.roles?.some((r) => CAN_MANAGE_ROLES.includes(r));
  if (!canManage) {
    redirect("/dashboard");
  }

  const post = await getPostForEditor(id, session.user.id);
  if (!post) {
    notFound();
  }
  const topics = await listTopicsForEditor();

  return (
    <main className="min-h-screen bg-background px-4 py-8 font-sans text-fp-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-fp-muted hover:text-fp-green"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mt-3 mb-6 text-3xl font-bold">Edit post</h1>
        <PostEditor
          postId={post.id}
          initialTitle={post.title}
          initialType={post.type}
          initialCover={post.coverImage ?? ""}
          initialVideoUrl={post.videoUrl ?? ""}
          initialAudioUrl={post.audioUrl ?? ""}
          initialTopicId={post.topicId}
          initialBlocks={post.blocks}
          status={post.status}
          topics={topics}
        />
      </div>
    </main>
  );
}
