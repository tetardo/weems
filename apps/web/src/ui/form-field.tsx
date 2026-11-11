import type { InputHTMLAttributes } from "react";

/** Classes of an input of the Admin One forms. */
const INPUT_CLASS =
  "h-12 w-full max-w-full rounded-sm border border-gray-700 bg-white px-3 py-2 focus:border-blue-600 focus:ring-3 focus:ring-blue-600 focus:outline-hidden";

/** A labelled input, with an optional help line below. */
export function FormField({
  label,
  help,
  ...input
}: { label: string; help?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-6 block last:mb-0">
      <span className="mb-2 block font-semibold">{label}</span>
      <input required className={INPUT_CLASS} {...input} />
      {help && <span className="mt-1 block text-xs text-gray-500">{help}</span>}
    </label>
  );
}
