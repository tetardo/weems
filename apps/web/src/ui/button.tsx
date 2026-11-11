import type { ButtonHTMLAttributes } from "react";

/** Colours of the Admin One buttons used by the site. */
const COLORS = {
  info: "border-blue-600 bg-blue-600 text-white ring-blue-300 hover:border-blue-700 hover:bg-blue-700",
  light: "border-gray-100 bg-gray-100 text-black ring-gray-200 hover:bg-gray-200",
} as const;

/** Classes of a button. */
function buttonClass(color: keyof typeof COLORS = "info"): string {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border px-3 py-2 transition-colors duration-150 focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:opacity-70 ${COLORS[color]}`;
}

export function Button({
  color,
  className = "",
  type = "button",
  ...props
}: { color?: keyof typeof COLORS } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${buttonClass(color)} ${className}`} {...props} />;
}
