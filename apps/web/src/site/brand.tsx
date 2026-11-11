import { Link } from "../i18n/navigation.ts";

/**
 * Name of the site with the « Waterline » symbol (identity sheet v1, direction A): the W of
 * the aircraft symbol of an attitude indicator, in the accent colour (GameLab bar look).
 */
export function Brand({ name }: { name: string }) {
  return (
    <Link href="/flights" className="flex min-h-11 items-center gap-2 rounded-[10px] px-2">
      <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true" className="text-accent">
        <path
          d="M2 9h5l2.5 7L12 10l2.5 6L17 9h5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-title text-[17px] font-bold tracking-[.01em]">{name}</span>
    </Link>
  );
}
