import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { MediaLibrary } from "@/components/media-library";
import { listMediaAssets } from "@/lib/media-data";

const CAN_MANAGE_ROLES = ["EDITOR", "SUPERADMIN"];

export const metadata = {
  title: "Media library · FamilyPulse",
};

export default async function MediaLibraryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard/media");
  }
  const canManage = session.user.roles?.some((role) => CAN_MANAGE_ROLES.includes(role));
  if (!canManage) {
    redirect("/dashboard");
  }

  const assets = await listMediaAssets();

  return (
    <main className="min-h-screen bg-background px-4 py-8 font-sans text-fp-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-fp-muted hover:text-fp-green">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="mt-3 mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase text-fp-green">DigitalOcean Spaces</p>
            <h1 className="mt-1 text-3xl font-bold">Media library</h1>
          </div>
        </div>
        <MediaLibrary assets={assets} />
      </div>
    </main>
  );
}
