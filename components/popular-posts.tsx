import Image from "next/image";
import type { PopularPost } from "@/lib/familypulse-data";
import { SectionHeader } from "./section-header";

export function PopularPosts({ posts }: { posts: PopularPost[] }) {
  return (
    <section className="rounded-lg border border-fp-line bg-white p-4 shadow-card">
      <SectionHeader title="Popular Posts" compact />
      <div className="space-y-3">
        {posts.map((post, index) => (
          <a key={post.title} href="#" className="grid grid-cols-[1.55rem_4.3rem_1fr] items-center gap-3 border-b border-fp-line pb-3 last:border-0 last:pb-0">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-fp-green text-[11px] font-extrabold text-white">
              {index + 1}
            </span>
            <span className="relative h-14 overflow-hidden rounded-sm">
              <Image src={post.image} alt={post.title} fill className="object-cover" sizes="72px" />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-extrabold leading-tight text-fp-ink">{post.title}</span>
              <span className="mt-1 block text-[11px] font-semibold text-fp-muted">
                {post.meta} <span className="mx-1 text-fp-green">&middot;</span> {post.read}
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
