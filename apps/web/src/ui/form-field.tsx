import type { InputHTMLAttributes } from "react";

/** Classes of an input of the Admin One forms. */
const INPUT_CLASS =
  "h-11 w-full max-w-full rounded-lg border border-[#d2d6da] bg-white px-3 py-2 text-sm text-[#495057] focus:border-[#e293d3] focus:shadow-[0_0_0_2px_#e9aede] focus:outline-hidden";

/** A labelled input, with an optional help line below. */
export function FormField({
  label,
  help,
  ...input
}: { label: string; help?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-6 block last:mb-0">
      <span className="mb-2 ml-1 block text-xs font-bold text-[#344767]">{label}</span>
      <input required className={INPUT_CLASS} {...input} />
      {help && <span className="mt-1 block text-xs text-gray-500">{help}</span>}
    </label>
  );
}
