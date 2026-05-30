import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 font-sans text-fp-ink">
      <section className="max-w-md rounded-lg border border-fp-line bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-bold">Sign-in failed</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
          The sign-in link may have expired or the provider could not complete the request.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green"
          href="/signin"
        >
          Try again
        </Link>
      </section>
    </main>
  );
}
