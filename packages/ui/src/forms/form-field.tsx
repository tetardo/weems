import { type InputHTMLAttributes, useId } from "react";
import { Field } from "./field.tsx";
import { INPUT_CLASS } from "./input-class.ts";

/** A required input with its label and an optional help line (sign-in and sign-up forms). */
export function FormField({
  label,
  help,
  ...input
}: { label: string; help?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help} className="mb-3.5">
      <input id={id} required className={INPUT_CLASS} {...input} />
    </Field>
  );
}
