import type { SelectHTMLAttributes } from "react";
import { ChevronIcon } from "./icons.ts";
import { INPUT_CLASS } from "./input-class.ts";

/**
 * A short list (a handful of choices): the browser's own list, drawn like the other fields.
 * `appearance-none` because Safari ignores the height of a native select (fiche 008). A long
 * list to search in (countries) is a SearchSelect.
 */
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative flex ${className}`}>
      <select className={`${INPUT_CLASS} h-11 cursor-pointer appearance-none pr-9`} {...props} />
      <ChevronIcon
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      />
    </span>
  );
}
