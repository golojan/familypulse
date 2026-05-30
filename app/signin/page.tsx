import { Mail, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl ?? "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 font-sans text-fp-ink sm:px-6 justify-center items-center flex">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-lg border border-fp-line bg-white shadow-card lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-fp-green p-8 text-white sm:p-10">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/15">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">
            Sign in to FamilyPulse
          </h1>
          <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/85 sm:text-base">
            Access saved articles, podcast updates, member resources, and your family learning
            dashboard.
          </p>
        </section>

        <section className="p-6 sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-fp-ink">Welcome back</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-fp-muted">
              Use Google or a secure email magic link to continue.
            </p>
          </div>

          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button className="flex min-h-12 w-full items-center justify-center rounded-md border border-fp-line bg-white px-4 text-sm font-extrabold text-fp-ink shadow-soft">
              Continue with Google
            </button>
          </form>

          <div className="my-7 flex items-center gap-3 text-xs font-extrabold uppercase text-fp-muted">
            <span className="h-px flex-1 bg-fp-line" />
            or
            <span className="h-px flex-1 bg-fp-line" />
          </div>

          <form
            className="grid gap-3"
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") ?? "");
              await signIn("resend", { email, redirectTo: callbackUrl });
            }}
          >
            <label className="grid gap-2 text-sm font-extrabold text-fp-ink">
              Email address
              <span className="flex min-h-12 items-center gap-3 rounded-md border border-fp-line bg-white px-4 shadow-soft focus-within:ring-4 focus-within:ring-fp-green/15">
                <Mail className="h-5 w-5 text-fp-green" />
                <input
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </span>
            </label>
            <button className="min-h-12 rounded-md bg-fp-green px-5 text-sm font-extrabold !text-white shadow-green">
              Send magic link
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
