import Image from "next/image";
import { ChevronRight, Headphones, UsersRound } from "lucide-react";

export function HeroSliderCard() {
  return (
    <section className="relative overflow-hidden rounded-none border border-fp-line bg-fp-cream shadow-card">
      <div className="grid min-h-[540px] lg:min-h-[326px] lg:grid-cols-[0.95fr_1.05fr] 2xl:min-h-[286px]">
        <div className="relative z-10 flex max-w-[92%] flex-col justify-start px-5 pb-28 pt-10 sm:max-w-[62%] sm:px-10 lg:max-w-none lg:justify-center lg:px-12 lg:py-7 2xl:px-12">
          <p className="mb-4 text-sm font-extrabold text-fp-green sm:text-base">Stronger Families. Better Futures.</p>
          <h1 className="max-w-[610px] text-[1.85rem] font-bold leading-[1.04] text-fp-ink sm:text-5xl lg:text-[3.15rem] 2xl:text-[2.55rem]">
            Healthy Family Growth Starts with <span className="text-fp-green">Conversations</span> That Matter
          </h1>
          <p className="mt-5 max-w-[560px] text-sm font-medium leading-6 text-fp-muted sm:text-base lg:text-lg 2xl:text-base">
            Articles, podcasts and videos to help you build better relationships, raise confident children and create a balanced, joyful family life.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-2 rounded-md bg-fp-green px-4 py-3.5 text-sm font-extrabold !text-white shadow-green sm:gap-3 sm:px-6" href="#articles">
              Explore Articles <ChevronRight className="h-5 w-5" />
            </a>
            <a className="inline-flex items-center gap-2 rounded-md border border-fp-green/20 bg-white px-4 py-3.5 text-sm font-extrabold text-fp-ink shadow-soft sm:gap-3 sm:px-6" href="#podcast">
              Listen to Podcast <Headphones className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="absolute inset-y-0 right-0 w-[62%] sm:w-[58%] lg:relative lg:w-auto lg:min-h-full">
          <Image
            src="https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1400&q=85"
            alt="Happy family sitting together"
            fill
            priority
            sizes="(max-width: 1024px) 62vw, (max-width: 1536px) 58vw, 45vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-fp-cream to-transparent" />
          <div className="absolute bottom-5 left-auto right-5 flex max-w-[86%] items-center gap-3 rounded-md bg-fp-green/95 p-3 text-white shadow-green backdrop-blur sm:w-[390px] lg:gap-4 lg:p-4 2xl:w-[300px]">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-white/15 lg:h-14 lg:w-14">
              <UsersRound className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold lg:text-base">Our Mission</h3>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-white/85 lg:text-xs lg:leading-5">
                To empower families with knowledge, support and tools for stronger lives.
              </p>
            </div>
            <ChevronRight className="ml-auto hidden h-6 w-6 sm:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
