"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Save } from "lucide-react";
import { updateUserRoles, type UpdateUserRolesState } from "@/app/dashboard/users/actions";

const INITIAL_STATE: UpdateUserRolesState = { ok: false };

const ROLE_OPTIONS = [
  { value: "USER", label: "User", description: "Standard reader account" },
  { value: "EDITOR", label: "Editor", description: "Can create and manage content" },
  { value: "SUPERADMIN", label: "Superadmin", description: "Full administration access" },
] as const;

type UserRoleFormProps = {
  userId: string;
  roles: string[];
  isCurrentUser: boolean;
};

export function UserRoleForm({ userId, roles, isCurrentUser }: UserRoleFormProps) {
  const [state, action] = useActionState(updateUserRoles, INITIAL_STATE);

  return (
    <form action={action} className="mt-5 border-t border-fp-line pt-5">
      <input type="hidden" name="userId" value={userId} />

      <fieldset>
        <legend className="text-xs font-extrabold uppercase tracking-wide text-fp-muted">
          Assigned roles
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ROLE_OPTIONS.map((role) => {
            const lockCurrentSuperadmin = isCurrentUser && role.value === "SUPERADMIN";

            return (
              <label
                key={role.value}
                className={`flex items-start gap-3 rounded-md border px-3 py-3 transition ${
                  lockCurrentSuperadmin
                    ? "border-fp-green/30 bg-fp-mint/60"
                    : "border-fp-line bg-white hover:border-fp-green/50"
                }`}
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={role.value}
                  defaultChecked={roles.includes(role.value)}
                  disabled={lockCurrentSuperadmin}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-fp-green"
                />
                {lockCurrentSuperadmin ? (
                  <input type="hidden" name="roles" value="SUPERADMIN" />
                ) : null}
                <span>
                  <span className="block text-sm font-extrabold text-fp-ink">{role.label}</span>
                  <span className="mt-0.5 block text-xs font-semibold leading-4 text-fp-muted">
                    {role.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-5 text-xs font-bold" aria-live="polite">
          {state.error ? <p className="text-red-600">{state.error}</p> : null}
          {state.ok ? (
            <p className="inline-flex items-center gap-1.5 text-fp-green">
              <Check className="h-3.5 w-3.5" /> Roles saved
            </p>
          ) : null}
        </div>
        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-fp-green px-4 text-xs font-extrabold !text-white shadow-green disabled:opacity-60"
    >
      <Save className={`h-3.5 w-3.5 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "Saving..." : "Save roles"}
    </button>
  );
}
