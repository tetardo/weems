import type { ReactNode } from "react";

/**
 * Small pieces of the step illustrations: fictitious screens of Weems, drawn with the site's
 * colours. Decorative only (hidden from screen readers, the step text says the same thing).
 */
export function IllustrationCard({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[420px] rounded-box border border-line bg-bg p-4 text-[13px] shadow-raised"
    >
      {children}
    </div>
  );
}

export function Chip({ children, mono = false }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-tag border border-line bg-surface px-2 py-1 text-xs text-muted ${mono ? "font-mono" : ""}`}
    >
      {children}
    </span>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>;
}

/** Title line of an illustration, with something on the right. */
export function IllustrationHead({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 font-semibold">
      {left}
      {right}
    </div>
  );
}

export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-tag bg-accent/12 px-2 py-0.5 text-xs font-semibold text-link">
      {children}
    </span>
  );
}
