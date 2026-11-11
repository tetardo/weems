import type { InputHTMLAttributes } from "react";

/** A labelled input of the login and sign-up forms. */
export function Field({
  label,
  ...input
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input required className="rounded border border-line px-2 py-1.5 text-base" {...input} />
    </label>
  );
}
