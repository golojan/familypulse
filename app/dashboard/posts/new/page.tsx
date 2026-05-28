import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { PostEditor } from "@/components/post-editor";
import { listTopicsForEditor } from "@/lib/topics-data";

const CAN_MANAGE_ROLES = ["EDITOR", "SUPERADMIN"];

export const metadata = {
  title: "New post · FamilyPulse",
};

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard/posts/new");
  }
  const canManage = session.user.roles?.some((r) => CAN_MANAGE_ROLES.includes(r));
  if (!canManage) {
    redirect("/dashboard");
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
        <h1 className="mt-3 mb-6 text-3xl font-bold">New post</h1>
        <PostEditor topics={topics} />
      </div>
    </main>
  );
}
