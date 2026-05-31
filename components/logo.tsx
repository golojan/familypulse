import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="FamilyPulse"
        width={40}
        height={40}
        priority
        className="h-9 w-9 sm:h-10 sm:w-10"
      />
      <span className="text-[1.45rem] font-extrabold text-fp-green sm:text-3xl">FamilyPulse</span>
    </div>
  );
}
