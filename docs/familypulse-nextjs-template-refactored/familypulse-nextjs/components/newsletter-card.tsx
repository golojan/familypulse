import { Mail } from "lucide-react";

export function NewsletterCard() {
  return (
    <div className="rounded-[1.7rem] border border-fp-green/15 bg-fp-cream p-5 shadow-card sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-fp-green shadow-soft">
          <Mail className="h-8 w-8" />
        </span>
        <div className="flex-1">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-fp-ink">Stay Inspired. Get Weekly Family Insights.</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-fp-muted">Practical tips, inspiring stories and podcast updates delivered to your inbox.</p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input className="min-h-12 flex-1 rounded-2xl border border-fp-line bg-white px-4 text-sm font-semibold outline-none ring-fp-green/20 focus:ring-4" placeholder="Enter your email address" />
            <button className="rounded-2xl bg-fp-green px-6 py-3 text-sm font-black text-white shadow-green">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  );
}
