"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Images, LayoutDashboard, LogOut, PenLine, UserRound } from "lucide-react";
import { logout } from "@/app/auth-actions";

type UserAccountMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  canManagePosts: boolean;
};

export function UserAccountMenu({ name, email, image, canManagePosts }: UserAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = getInitials(name ?? email ?? "Account");

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {canManagePosts ? (
        <Link
          className="hidden items-center gap-2 rounded-md bg-fp-green px-4 py-3 text-sm font-extrabold !text-white shadow-green md:inline-flex"
          href="/dashboard/posts/new"
        >
          <PenLine className="h-4 w-4" />
          New Post
        </Link>
      ) : null}

      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-fp-line bg-white px-2 text-fp-ink shadow-soft"
        >
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-fp-mint text-xs font-extrabold text-fp-green">
            {image ? (
              <Image
                src={image}
                alt={name ? `${name} avatar` : "User avatar"}
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : (
              initials
            )}
          </span>
          <ChevronDown
            className={`hidden h-4 w-4 text-fp-muted transition sm:block ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 overflow-hidden rounded-lg border border-fp-line bg-white shadow-card"
          >
            <div className="border-b border-fp-line px-4 py-3">
              <p className="truncate text-sm font-extrabold text-fp-ink">
                {name ?? "FamilyPulse user"}
              </p>
              {email ? (
                <p className="mt-0.5 truncate text-xs font-semibold text-fp-muted">{email}</p>
              ) : null}
            </div>

            <Link
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-fp-ink hover:bg-fp-mint/60"
              href="/dashboard"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-fp-green" />
              Dashboard
            </Link>
            {canManagePosts ? (
              <Link
                role="menuitem"
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-fp-ink hover:bg-fp-mint/60"
                href="/dashboard/media"
                onClick={() => setOpen(false)}
              >
                <Images className="h-4 w-4 text-fp-green" />
                Media library
              </Link>
            ) : null}
            <Link
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-fp-ink hover:bg-fp-mint/60"
              href="/profile"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4 text-fp-green" />
              Profile
            </Link>
            <form action={logout} className="border-t border-fp-line">
              <button
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
