import { Heart } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-2xl border border-fp-green/20 bg-fp-mint text-fp-green shadow-soft sm:h-10 sm:w-10">
        <Heart className="h-5 w-5" fill="currentColor" />
      </div>
      <span className="text-[1.45rem] font-black tracking-[-0.04em] text-fp-green sm:text-3xl">
        FamilyPulse
      </span>
    </div>
  );
}
