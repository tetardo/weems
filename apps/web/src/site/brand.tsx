import { Link } from "../i18n/navigation.ts";

/** Path of the « Waterline » W, in a 24 × 24 box (also drawn on the share images). */
export const BRAND_PATH = "M2 9h5l2.5 7L12 10l2.5 6L17 9h5";

/**
 * The « Waterline » symbol (identity sheet v1, direction A): the W of the aircraft symbol of an
 * attitude indicator, in the accent colour.
 */
export function BrandMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="text-accent">
      <path
        d={BRAND_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Name of the site with its symbol (GameLab bar look). Leads to the home page. */
export function Brand({ name }: { name: string }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2 rounded-control px-2">
      <BrandMark size={24} />
      <span className="font-title text-[17px] font-bold tracking-[.01em]">{name}</span>
    </Link>
  );
}
