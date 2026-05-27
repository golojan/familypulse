import Image from "next/image";
import { ChevronRight, Headphones, UsersRound } from "lucide-react";

export function HeroSliderCard() {
  return (
    <section className="relative overflow-hidden rounded-[1.7rem] border border-fp-line bg-fp-cream shadow-card lg:rounded-[2rem]">
      <div className="grid min-h-[430px] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-14">
          <p className="mb-4 text-sm font-black text-fp-green sm:text-base">Stronger Families. Better Futures.</p>
          <h1 className="max-w-[610px] text-[2.45rem] font-black leading-[0.96] tracking-[-0.065em] text-fp-ink sm:text-6xl lg:text-[4.7rem]">
            Healthy Family Growth Starts with <span className="text-fp-green">Conversations</span> That Matter
          </h1>
          <p className="mt-5 max-w-[560px] text-base font-medium leading-7 text-fp-muted sm:text-lg">
            Articles, podcasts and videos to help you build better relationships, raise confident children and create a balanced, joyful family life.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-3 rounded-2xl bg-fp-green px-6 py-3.5 text-sm font-black text-white shadow-green" href="#articles">
              Explore Articles <ChevronRight className="h-5 w-5" />
            </a>
            <a className="inline-flex items-center gap-3 rounded-2xl border border-fp-green/20 bg-white px-6 py-3.5 text-sm font-black text-fp-ink shadow-soft" href="#podcast">
              Listen to Podcast <Headphones className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="relative min-h-[280px] lg:min-h-full">
          <Image
            src="https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1400&q=85"
            alt="Happy family sitting together"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-y-0 left-0 hidden w-44 bg-gradient-to-r from-fp-cream to-transparent lg:block" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-[1.35rem] bg-fp-green/95 p-4 text-white shadow-green backdrop-blur sm:left-auto sm:w-[390px]">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
              <UsersRound className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-black">Our Mission</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-white/85">
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
