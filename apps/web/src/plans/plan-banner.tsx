import type { PlanId } from "@weems/contrats";
import type { ReactNode } from "react";

/**
 * Small line drawing on top of each plan card (page Offres): Free takes off, Pro is on the glide
 * path with its analysis, Company lines up its fleet, Holding links its airlines around the globe.
 * Drawn in the current colour, so the theme decides.
 */

const PLANE_PATH =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

function Plane({ at }: { at: string }) {
  return (
    <path
      transform={at}
      d={PLANE_PATH}
      fill="currentColor"
      fillOpacity={0.18}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  );
}

const Ground = ({ y }: { y: number }) => (
  <path d={`M0 ${y}h300`} stroke="currentColor" strokeOpacity={0.35} />
);

const ART: Record<PlanId, ReactNode> = {
  pilot_free: (
    <>
      <Ground y={66} />
      <path
        d="M40 66 C90 64 130 52 170 34"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeDasharray="4 5"
        fill="none"
        strokeOpacity={0.7}
      />
      <Plane at="translate(168 14) rotate(20 12 12) scale(1.15)" />
      <circle cx={250} cy={22} r={9} fill="currentColor" fillOpacity={0.12} />
    </>
  ),
  pilot_pro: (
    <>
      <Ground y={70} />
      <path
        d="M60 18 L230 70"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeDasharray="2 4"
        strokeOpacity={0.6}
      />
      <path d="M60 30 L230 70M60 6 L230 70" stroke="currentColor" strokeOpacity={0.18} />
      <rect x={214} y={66} width={34} height={8} rx={1} fill="currentColor" fillOpacity={0.25} />
      <Plane at="translate(108 18) rotate(62 12 12) scale(1.1)" />
      <path
        d="M18 58v-10M28 58v-18M38 58v-13M48 58v-24"
        stroke="currentColor"
        strokeWidth={1.8}
        fill="none"
      />
      <circle cx={262} cy={24} r={12} stroke="currentColor" strokeWidth={1.6} fill="none" />
      <path d="m256 24 4 4 8-8" stroke="currentColor" strokeWidth={1.8} fill="none" />
    </>
  ),
  company: (
    <>
      <Ground y={70} />
      <path
        d="M206 70 L230 22 h22 l-6 48z"
        fill="currentColor"
        fillOpacity={0.22}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M226 42l6 10 6-14 6 14"
        stroke="currentColor"
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="round"
      />
      <Plane at="translate(36 26) rotate(45 12 12)" />
      <Plane at="translate(84 36) rotate(45 12 12)" />
      <Plane at="translate(132 26) rotate(45 12 12)" />
    </>
  ),
  holding: (
    <>
      <g stroke="currentColor" fill="none" strokeOpacity={0.35}>
        <circle cx={150} cy={96} r={78} />
        <ellipse cx={150} cy={96} rx={36} ry={78} />
        <path d="M72 70h156M90 44h120" />
      </g>
      <g stroke="currentColor" strokeWidth={1.4} strokeDasharray="3 4" fill="none">
        <path d="M40 40 Q95 6 150 30M150 30 Q205 6 260 40M40 40 Q80 70 110 62M260 40 Q220 70 190 62" />
      </g>
      <g fill="currentColor">
        <circle cx={40} cy={40} r={4.5} />
        <circle cx={150} cy={30} r={5.5} />
        <circle cx={260} cy={40} r={4.5} />
        <circle cx={110} cy={62} r={4.5} />
        <circle cx={190} cy={62} r={4.5} />
      </g>
    </>
  ),
};

/** Pilot plans in the accent colour, airline plans in the second accent. */
const TONE: Record<PlanId, string> = {
  pilot_free: "text-muted",
  pilot_pro: "text-link",
  company: "text-accent-2",
  holding: "text-accent-2",
};

export function PlanBanner({ plan }: { plan: PlanId }) {
  const gradient = `plan-banner-${plan}`;
  return (
    <svg
      viewBox="0 0 300 84"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`block h-21 w-full border-b border-line ${TONE[plan]}`}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop
            offset="0"
            stopColor="currentColor"
            stopOpacity={plan === "holding" ? 0.32 : 0.22}
          />
          <stop offset="1" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={300} height={84} fill={`url(#${gradient})`} />
      {ART[plan]}
    </svg>
  );
}
