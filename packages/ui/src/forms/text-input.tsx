import type { InputHTMLAttributes, ReactNode } from "react";
import type { IconComponent } from "../icons.ts";
import { BARE_INPUT_CLASS, CONTROL_CLASS } from "./input-class.ts";

/**
 * A one-line input (fiche 008), with what helps reading it: an icon or a fixed prefix on the
 * left (`instagram.com/`), a status on the right. `warn`: orange border, for a change with
 * consequences (address of a published page).
 */
export function TextInput({
  icon: Icon,
  prefix,
  end,
  warn = false,
  className = "",
  ...input
}: {
  icon?: IconComponent | undefined;
  prefix?: string | undefined;
  end?: ReactNode;
  warn?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={`${CONTROL_CLASS} ${warn ? "border-accent-2" : "border-line"}`}>
      {Icon && <Icon size={18} aria-hidden="true" className="flex-none text-muted" />}
      {prefix && <span className="text-sm whitespace-nowrap text-muted">{prefix}</span>}
      <input className={`${BARE_INPUT_CLASS} ${className}`} {...input} />
      {end}
    </span>
  );
}
