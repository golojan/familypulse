import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 font-sans text-fp-ink">
      <section className="max-w-md rounded-lg border border-fp-line bg-white p-8 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fp-mint text-fp-green">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
          We sent a secure sign-in link. Open it from the same browser to finish signing in.
        </p>
        <Link className="mt-6 inline-flex rounded-md border border-fp-line bg-white px-5 py-3 text-sm font-extrabold text-fp-ink shadow-soft" href="/">
          Back home
        </Link>
      </section>
    </main>
  );
}
