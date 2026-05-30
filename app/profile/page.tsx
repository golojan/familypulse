import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { auth } from "@/auth";

export const metadata = {
  title: "Profile · FamilyPulse",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin?callbackUrl=/profile");
  }

  const roles = session.user.roles?.length ? session.user.roles : ["USER"];

  return (
    <main className="min-h-screen bg-background px-4 py-10 font-sans text-fp-ink sm:px-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-fp-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-4">
          <span className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-fp-mint text-lg font-extrabold text-fp-green">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ? `${session.user.name} avatar` : "User avatar"}
                fill
                className="object-cover"
                sizes="64px"
                priority
              />
            ) : (
              <UserRound className="h-8 w-8" />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-fp-ink">
              {session.user.name ?? "FamilyPulse user"}
            </h1>
            {session.user.email ? (
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-fp-muted">
                <Mail className="h-4 w-4 text-fp-green" />
                {session.user.email}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 rounded-md border border-fp-line bg-fp-soft p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-fp-ink">
            <ShieldCheck className="h-4 w-4 text-fp-green" />
            Account roles
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-fp-green shadow-soft"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <Link
          className="mt-6 inline-flex rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
          href="/dashboard"
        >
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
