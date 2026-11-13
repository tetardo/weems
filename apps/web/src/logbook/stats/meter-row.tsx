import type { ReactNode } from "react";

/** A line of a ranking: label, a bar as long as its share of the largest, and the value. */
export function MeterRow({
  label,
  value,
  ratio,
  fill = "bg-accent",
}: {
  label: ReactNode;
  value: string;
  /** 0 to 1. */
  ratio: number;
  fill?: string;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_72px_auto] items-center gap-3 py-1 text-[13.5px]">
      <span className="truncate">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-line">
        <i
          className={`block h-full rounded-full ${fill}`}
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </span>
      <b className="min-w-[3.5em] text-right font-semibold tabular-nums">{value}</b>
    </li>
  );
}
