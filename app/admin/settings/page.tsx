import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { getSettingsStatus } from "@/lib/settings";
import { hasEncryptionKey } from "@/lib/crypto";
import { SettingsForm } from "@/components/settings-form";

export const metadata = {
  title: "Site Settings · FamilyPulse",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/admin/settings");
  }
  if (!session.user.roles?.includes("SUPERADMIN")) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 font-sans text-fp-ink">
        <div className="mx-auto max-w-lg rounded-lg border border-fp-line bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Superadmin only</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
            Site settings can only be managed by a FamilyPulse superadmin.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const status = await getSettingsStatus();
  const encryptionReady = hasEncryptionKey();

  return (
    <main className="min-h-screen bg-background px-4 py-8 font-sans text-fp-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-fp-muted hover:text-fp-green"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Site Settings</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-fp-muted">
          Configure authentication, email, and storage. Saved values are used in
          preference to environment variables. Secrets are encrypted at rest and
          never displayed again after saving.
        </p>

        {!encryptionReady ? (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            <p>
              <code className="font-mono">SETTINGS_ENCRYPTION_KEY</code> is not set on the
              server. Set it before saving — secret values cannot be stored securely
              without it.
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <SettingsForm status={status} />
        </div>
      </div>
    </main>
  );
}
