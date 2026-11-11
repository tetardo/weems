import type { ButtonHTMLAttributes } from "react";

/** Colours of the Admin One buttons used by the site. */
const COLORS = {
  info: "border-0 bg-gradient-fuchsia text-white shadow-soft-sm ring-fuchsia-200 hover:scale-[1.02]",
  light:
    "border border-[#cb0c9f] bg-transparent text-[#cb0c9f] ring-fuchsia-100 hover:bg-fuchsia-50",
} as const;

/** Classes of a button. */
function buttonClass(color: keyof typeof COLORS = "info"): string {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-2.5 text-xs font-bold tracking-wide uppercase transition-all duration-150 focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:opacity-70 ${COLORS[color]}`;
}

export function Button({
  color,
  className = "",
  type = "button",
  ...props
}: { color?: keyof typeof COLORS } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${buttonClass(color)} ${className}`} {...props} />;
}
