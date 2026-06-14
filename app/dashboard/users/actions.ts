"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/generated/prisma/enums";

const ASSIGNABLE_ROLES = ["USER", "EDITOR", "SUPERADMIN"] as const satisfies readonly Role[];

export type UpdateUserRolesState = {
  ok: boolean;
  error?: string;
  savedAt?: number;
};

export async function updateUserRoles(
  _previousState: UpdateUserRolesState,
  formData: FormData,
): Promise<UpdateUserRolesState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in to manage users." };
  }
  if (!session.user.roles?.includes("SUPERADMIN")) {
    return { ok: false, error: "Only superadmins can assign roles." };
  }

  const userId = formData.get("userId");
  const submittedRoles = formData.getAll("roles");

  if (typeof userId !== "string" || !userId) {
    return { ok: false, error: "The selected user could not be identified." };
  }
  if (!submittedRoles.every((role) => typeof role === "string")) {
    return { ok: false, error: "The submitted roles are invalid." };
  }

  const roles = Array.from(new Set(submittedRoles as string[]));
  if (roles.length === 0) {
    return { ok: false, error: "Select at least one role." };
  }
  if (!roles.every(isAssignableRole)) {
    return { ok: false, error: "The submitted roles are invalid." };
  }
  if (userId === session.user.id && !roles.includes("SUPERADMIN")) {
    return { ok: false, error: "You cannot remove your own superadmin role." };
  }

  try {
    const result = await prisma.user.updateMany({
      where: { id: userId },
      data: { roles },
    });

    if (result.count === 0) {
      return { ok: false, error: "That user no longer exists." };
    }
  } catch {
    return { ok: false, error: "Roles could not be saved. Please try again." };
  }

  revalidatePath("/dashboard/users");
  return { ok: true, savedAt: Date.now() };
}

function isAssignableRole(role: string): role is Role {
  return ASSIGNABLE_ROLES.some((assignableRole) => assignableRole === role);
}
