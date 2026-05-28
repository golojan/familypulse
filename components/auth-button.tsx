import Link from "next/link";
import { LogIn } from "lucide-react";
import { auth } from "@/auth";
import { UserAccountMenu } from "./user-account-menu";

const CAN_MANAGE_POSTS = ["EDITOR", "SUPERADMIN"];

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

  const canManagePosts = session.user.roles?.some((role) => CAN_MANAGE_POSTS.includes(role)) ?? false;

  return <UserAccountMenu canManagePosts={canManagePosts} email={session.user.email} image={session.user.image} name={session.user.name} />;
}
