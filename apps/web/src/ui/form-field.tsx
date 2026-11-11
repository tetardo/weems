import type { InputHTMLAttributes } from "react";
import { INPUT_CLASS } from "./input-class.ts";

/** A labelled input, with an optional help line below (GameLab .gl-field). */
export function FormField({
  label,
  help,
  ...input
}: { label: string; help?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-3.5 flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      <input required className={INPUT_CLASS} {...input} />
      {help && <span className="text-[.9em] text-muted">{help}</span>}
    </label>
  );
}
