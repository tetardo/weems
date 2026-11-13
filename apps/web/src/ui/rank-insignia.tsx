import { type PilotRank, rankTier } from "@weems/contrats";
import { useId } from "react";

/** Metal of each tier of 3 ranks (variables of global.css). */
const METALS = ["var(--color-rank-bronze)", "var(--color-rank-silver)", "var(--color-rank-gold)"];
const PLATE = "var(--color-rank-plate)";

/** Feathers and span of each wing, by tier: the wings grow at each tier. */
const FEATHERS = [2, 3, 4];
const SPAN = [14, 19, 24];

function starPath(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 10 }, (_, k) => {
    const angle = -Math.PI / 2 + (k * Math.PI) / 5;
    const radius = k % 2 ? r * 0.45 : r;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

function Wings({ tier, fill }: { tier: number; fill: string }) {
  const feathers = FEATHERS[tier] ?? 2;
  const span = SPAN[tier] ?? 14;
  return [-1, 1].flatMap((side) =>
    Array.from({ length: feathers }, (_, j) => {
      const y = 30 + j * 4.4;
      const len = span - j * 4;
      return (
        <path
          key={`${side}-${j}`}
          d={`M${32 + side * 7} ${y}q${side * len * 0.6} -6 ${side * len} -3.5q${-side * len * 0.4} 5.5 ${-side * len} 7.5z`}
          fill={fill}
          opacity={1 - j * 0.13}
        />
      );
    }),
  );
}

/** Marks of the rank inside its tier: 1 to 3 bars, then at the gold tier a star and 1 to 3 stars. */
function Marks({ tier, step, metal }: { tier: number; step: number; metal: string }) {
  if (tier < 2) {
    return Array.from({ length: step + 1 }, (_, k) => (
      <rect
        key={k}
        x={32 - (step + 1) * 1.7 + k * 3.4 + 0.3}
        y={28.5}
        width={2}
        height={9}
        rx={0.5}
        fill={metal}
      />
    ));
  }
  return (
    <>
      <path d={starPath(32, 33, 6.5)} fill={metal} />
      {Array.from({ length: step + 1 }, (_, k) => (
        <path key={k} d={starPath(32 + (k - step / 2) * 9, 15, 4)} fill={metal} />
      ))}
    </>
  );
}

/**
 * Insignia of a pilot rank (spec grades des pilotes): pilot wings whose metal changes at each tier
 * of 3 ranks (bronze, silver, gold) and that gain a mark at each rank. The drawing lives here only:
 * changing the insignia changes it everywhere.
 */
export function RankInsignia({
  rank,
  size = 24,
  title,
}: {
  rank: PilotRank;
  size?: number;
  /** Accessible name; decorative without it. */
  title?: string;
}) {
  const gradient = useId();
  const { tier, step } = rankTier(rank);
  const metal = METALS[tier] ?? "var(--color-rank-bronze)";
  const fill = `url(#${gradient})`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="flex-none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`color-mix(in srgb, ${metal} 55%, white)`} />
          <stop offset="0.55" stopColor={metal} />
          <stop offset="1" stopColor={`color-mix(in srgb, ${metal} 65%, black)`} />
        </linearGradient>
      </defs>
      <Wings tier={tier} fill={fill} />
      <circle cx={32} cy={33} r={tier === 2 ? 10 : 9} fill={PLATE} stroke={fill} strokeWidth={2} />
      <Marks tier={tier} step={step} metal={metal} />
    </svg>
  );
}
