import type { ReactNode } from "react";
import type { StepId } from "./discover-steps.ts";
import { Cloud, Ground, Plane, Runway, Sun, Trail } from "./scene-parts.tsx";

/**
 * One small drawn scene per step, above its fictitious screen: what the step feels like, told
 * with a plane, the sky and the runway (viewBox 400 × 64). Decorative only.
 */
const SCENES: Record<StepId, ReactNode> = {
  // The tracker: a take-off, the flight starts and is recorded.
  tracker: (
    <>
      <Ground />
      <Runway x={20} width={120} />
      <Trail d="M80 58 C150 56 200 40 262 18" />
      <Plane x={276} y={14} />
      <Cloud x={150} y={6} scale={0.8} />
      <Cloud x={320} y={30} />
      <Sun x={372} y={14} />
    </>
  ),
  // Every flight told: the landing, the touchdown marked on the runway.
  followUp: (
    <>
      <Ground />
      <Runway x={220} width={160} />
      <Trail d="M40 10 C120 14 200 40 262 56" />
      <Plane x={272} y={52} turn={75} />
      <circle cx="262" cy="58" r="3" className="fill-accent-2" />
      <Cloud x={60} y={26} scale={0.9} />
      <Cloud x={150} y={4} scale={0.7} />
    </>
  ),
  // Never alone: three pilots in the same sky.
  community: (
    <>
      <Trail d="M10 50 C90 20 160 20 210 30" />
      <Plane x={222} y={32} turn={60} />
      <Trail d="M60 10 C140 34 240 44 300 22" tone="stroke-accent-2" />
      <Plane x={312} y={16} turn={-10} tone="stroke-accent-2" />
      <Trail d="M150 60 C200 48 260 60 340 50" tone="stroke-success" />
      <Plane x={352} y={48} turn={35} tone="stroke-success" />
      <Cloud x={40} y={20} scale={0.7} />
      <Cloud x={250} y={2} scale={0.8} />
    </>
  ),
  // Simple: three waypoints, then the plane is in the air.
  simplicity: (
    <>
      <Trail d="M40 50 L140 40 L240 30 L330 16" />
      {[
        [40, 50],
        [140, 40],
        [240, 30],
      ].map(([cx, cy], i) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="10" className="fill-surface stroke-accent" strokeWidth="1.6" />
          <text
            x={cx}
            y={(cy ?? 0) + 4}
            textAnchor="middle"
            className="fill-link text-[11px] font-bold"
          >
            {i + 1}
          </text>
        </g>
      ))}
      <Plane x={344} y={12} />
      <Cloud x={70} y={4} scale={0.8} />
      <Sun x={210} y={6} />
    </>
  ),
  // Like a crew: a stabilised approach, gate after gate, down to the runway.
  training: (
    <>
      <Ground />
      <Runway x={250} width={140} />
      <Trail d="M30 8 L270 58" tone="stroke-success" />
      {[90, 150, 210].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy={8 + ((cx - 30) * 50) / 240}
          r="5"
          className="fill-surface stroke-success"
          strokeWidth="1.6"
        />
      ))}
      <Plane x={44} y={10} turn={60} />
      <Cloud x={300} y={8} scale={0.9} />
    </>
  ),
  // The path travelled: hills behind, a long climb and the sun ahead.
  progress: (
    <>
      <path d="M0 63 L50 36 L90 52 L150 22 L210 50 L260 34 L320 63 Z" className="fill-accent/12" />
      <Ground />
      <Trail d="M20 58 C120 54 220 40 330 12" tone="stroke-accent-2" />
      <Plane x={344} y={10} tone="stroke-accent-2" />
      <Cloud x={180} y={2} scale={0.7} />
      <Sun x={380} y={30} />
    </>
  ),
};

/** The little scene above the screen of a step. */
export function StepScene({ id }: { id: StepId }) {
  return (
    <svg viewBox="0 0 400 64" className="relative mb-2 block h-20 w-full overflow-visible">
      {SCENES[id]}
    </svg>
  );
}
