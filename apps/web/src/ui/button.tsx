import type { ButtonHTMLAttributes } from "react";

/** Variants of the GameLab buttons used by the site (packages/shell, .gl-btn). */
const VARIANTS = {
  primary:
    "bg-accent text-on-accent hover:bg-[color-mix(in_srgb,var(--color-accent)_85%,var(--color-ink))]",
  outline: "border border-line hover:bg-ink/9",
  ghost: "hover:bg-ink/9",
} as const;

type Variant = keyof typeof VARIANTS;

/** Classes of a button, also used by the links and buttons of the top bar. */
export function buttonClass(variant: Variant = "primary"): string {
  return `inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 font-medium transition-colors duration-150 disabled:cursor-default disabled:opacity-55 ${VARIANTS[variant]}`;
}

export function Button({
  variant,
  className = "",
  type = "button",
  ...props
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${buttonClass(variant)} ${className}`} {...props} />;
}
