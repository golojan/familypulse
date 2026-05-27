import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { auth, signOut } from "@/auth";

export async function AuthButton() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link className="hidden items-center gap-2 rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green sm:inline-flex" href="/signin">
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  return (
    <form
      className="hidden sm:block"
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button className="inline-flex items-center gap-2 rounded-md bg-fp-green px-5 py-3 text-sm font-extrabold !text-white shadow-green">
        <UserRound className="h-4 w-4" />
        <span className="max-w-28 truncate">{session.user.name ?? "Account"}</span>
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  );
}
