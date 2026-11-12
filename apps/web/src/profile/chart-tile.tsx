import type { ReactNode } from "react";
import { InfoTip } from "../ui/info-tip.tsx";

/** A chart of the statistics section, in a card with its title (same look as the stat tiles). */
export function ChartTile({
  title,
  subtitle,
  info,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  info?: { text: string; label: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure
      className={`relative m-0 rounded-panel border border-line bg-surface px-4.5 py-4 ${className}`}
    >
      <figcaption>
        <span className="block text-[13px] text-muted">{title}</span>
        <span className="block pr-6 text-[12.5px] text-muted">{subtitle}</span>
      </figcaption>
      {info && <InfoTip {...info} />}
      {children}
    </figure>
  );
}

/** Text of an SVG chart, in the page font and muted colour. */
export function ChartText({
  x,
  y,
  children,
  anchor = "middle",
  strong = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  strong?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={11}
      fill={strong ? "var(--color-ink)" : "var(--color-muted)"}
    >
      {children}
    </text>
  );
}
