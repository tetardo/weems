import { Link } from "../i18n/navigation.ts";
import { PrivateIcon } from "../ui/icons.ts";

export interface Segment {
  key: string;
  href: string;
  label: string;
  current: boolean;
  /** Pilot Pro only: padlock, and the link goes to the offers. */
  locked?: boolean;
}

/** Choices of a logbook page as links in a segmented bar (filters of Vols, period of Stats). */
export function SegmentLinks({ label, segments }: { label: string; segments: readonly Segment[] }) {
  return (
    <nav
      aria-label={label}
      className="flex gap-1 rounded-control border border-line bg-surface p-1"
    >
      {segments.map((s) => (
        <Link
          key={s.key}
          href={s.locked ? "/plans" : s.href}
          aria-current={s.current ? "page" : undefined}
          className={`inline-flex items-center gap-1 rounded-inner px-3 py-1.5 text-[13.5px] font-medium ${s.current ? "bg-accent/12 text-link" : "text-muted hover:text-ink"}`}
        >
          {s.locked && <PrivateIcon size={13} className="text-accent-2" aria-hidden="true" />}
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
