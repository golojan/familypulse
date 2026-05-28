"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Circle, Database, Save, ServerCog } from "lucide-react";
import {
  SETTING_GROUPS,
  type SettingField,
  type SettingKey,
  type SettingStatus,
} from "@/lib/settings-catalog";
import { saveSettings, type SettingsActionState } from "@/app/admin/settings/actions";

const INITIAL: SettingsActionState = { ok: false };

type SettingsFormProps = {
  status: Record<SettingKey, SettingStatus>;
};

export function SettingsForm({ status }: SettingsFormProps) {
  const [state, action] = useActionState(saveSettings, INITIAL);

  return (
    <form action={action} className="grid gap-6">
      {state.error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-600" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-md bg-fp-green/10 px-4 py-3 text-sm font-bold text-fp-green" aria-live="polite">
          Settings saved.
        </p>
      ) : null}

      {SETTING_GROUPS.map((group) => (
        <section key={group.id} className="rounded-lg border border-fp-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-fp-ink">{group.title}</h2>
          <p className="mt-1 text-sm font-semibold text-fp-muted">{group.description}</p>

          <div className="mt-5 grid gap-5">
            {group.fields.map((field) => (
              <Field key={field.key} field={field} status={status[field.key]} />
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({ field, status }: { field: SettingField; status: SettingStatus }) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={field.key} className="text-sm font-extrabold text-fp-ink">
          {field.label}
        </label>
        <StatusBadge status={status} />
      </div>

      <input
        id={field.key}
        name={field.key}
        type={field.secret ? "password" : "text"}
        autoComplete="off"
        placeholder={
          field.secret && status.configured
            ? "•••••••• (leave blank to keep current)"
            : (field.placeholder ?? "")
        }
        defaultValue={field.secret ? "" : (status.displayValue ?? "")}
        className="w-full rounded-md border border-fp-line bg-white px-4 py-2.5 text-sm font-semibold text-fp-ink outline-none focus:ring-4 focus:ring-fp-green/15"
      />

      {field.secret && status.fromDatabase ? (
        <label className="flex items-center gap-2 text-xs font-bold text-fp-muted">
          <input type="checkbox" name={`clear:${field.key}`} className="h-3.5 w-3.5 accent-red-600" />
          Remove stored value
        </label>
      ) : null}

      {field.help ? <p className="text-xs font-semibold text-fp-muted">{field.help}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: SettingStatus }) {
  if (!status.configured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-fp-line/60 px-2.5 py-1 text-[11px] font-extrabold text-fp-muted">
        <Circle className="h-3 w-3" /> Not set
      </span>
    );
  }
  if (status.fromDatabase) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-fp-green/10 px-2.5 py-1 text-[11px] font-extrabold text-fp-green">
        <Database className="h-3 w-3" /> Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
      <ServerCog className="h-3 w-3" /> From .env
    </span>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-fp-green px-6 text-sm font-extrabold !text-white shadow-green disabled:opacity-60"
    >
      {pending ? <CheckCircle2 className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}
