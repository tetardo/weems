import type { ReactNode } from "react";

/**
 * Drawing kit of the feature illustrations (page Fonctionnalités): 72 × 48 line drawings in the
 * current colour, an accent group in the link colour, so both themes work without new colours.
 */

/** A small airliner seen from above, nose up, about 20 units long, centred on (x, y). */
export function PlaneTop({ x, y, rotate = 0, scale = 1 }: Placement) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      d="M0-10C1-10 1.6-8.6 1.6-7V-2.4L9.5 2.2V4.4L1.6 2V6.6L4.2 8.6V10.2L0 9.2-4.2 10.2V8.6L-1.6 6.6V2L-9.5 4.4V2.2L-1.6-2.4V-7C-1.6-8.6-1-10 0-10Z"
      fill="currentColor"
      fillOpacity={0.18}
      strokeLinejoin="round"
    />
  );
}

/** A small airliner seen from the side, nose right, about 22 units long, from (x, y). */
export function PlaneSide({ x, y, rotate = 0, scale = 1 }: Placement) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      d="M0 0H16C19 0 21.5 1.2 22 2.6 21.5 3.8 19.5 4.4 16 4.4H3L0.6 4 -2 -4H0.4L3 0ZM8 4.4 6 8H8.6L12 4.4"
      fill="currentColor"
      fillOpacity={0.18}
      strokeLinejoin="round"
    />
  );
}

interface Placement {
  x: number;
  y: number;
  rotate?: number;
  scale?: number;
}

/** Elements drawn in the accent colour (the part that tells what the function does). */
export function Accent({ children }: { children: ReactNode }) {
  return <g className="text-link">{children}</g>;
}

/** Ground or runway line across the drawing. */
export const Ground = ({ y = 42 }: { y?: number }) => <path d={`M4 ${y}H68`} strokeOpacity={0.4} />;

/** A screen or a sheet: rounded rectangle. */
export const Panel = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={2.5} />
);

/** The frame every illustration is drawn in: decorative, hidden from screen readers. */
export function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 72 48"
      aria-hidden="true"
      className="h-12 w-[72px] flex-none text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
