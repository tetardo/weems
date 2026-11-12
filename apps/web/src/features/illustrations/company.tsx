import type { ReactNode } from "react";
import { Accent, Ground, PlaneTop } from "./kit.tsx";

/** A tail fin seen from the side, the airline's colours on it, standing on y. */
function Tail({
  x,
  y,
  scale = 1,
  accent = false,
}: {
  x: number;
  y: number;
  scale?: number;
  accent?: boolean;
}) {
  const fin = (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M0 0 9-24H15L16-8 22 0Z"
      fill="currentColor"
      fillOpacity={accent ? 0.25 : 0.1}
    />
  );
  return accent ? <Accent>{fin}</Accent> : fin;
}

/** A pilot: cap and shoulders. */
function Pilot({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cy={-10} r={4.5} />
      <path d="M-5-13.5H5L4-16H-4Z" fill="currentColor" fillOpacity={0.3} />
      <path d="M-9 4C-8-2-5-4 0-4S8-2 9 4" />
    </g>
  );
}

/** Group « Diriger une compagnie ». */
export const COMPANY_ILLUSTRATIONS = {
  // Airlines: a tail fin with the airline's mark.
  companies: (
    <>
      <Ground y={40} />
      <Tail x={22} y={40} scale={1.3} accent />
      <path d="M14 40H58" />
    </>
  ),
  // Active pilots: a crew of three.
  activePilots: (
    <>
      <Pilot x={22} y={36} />
      <Accent>
        <Pilot x={36} y={32} />
      </Accent>
      <Pilot x={50} y={36} />
    </>
  ),
  // Fleet and routes: a hub and its spokes.
  fleetAndRoutes: (
    <>
      <path
        d="M36 24 10 10M36 24 62 8M36 24 8 40M36 24 64 40M36 24 36 4"
        strokeOpacity={0.5}
        strokeDasharray="2 2.5"
      />
      <circle cx={10} cy={10} r={2} />
      <circle cx={62} cy={8} r={2} />
      <circle cx={8} cy={40} r={2} />
      <circle cx={64} cy={40} r={2} />
      <Accent>
        <circle cx={36} cy={24} r={4} fill="currentColor" fillOpacity={0.3} />
        <PlaneTop x={52} y={32} rotate={130} scale={0.5} />
      </Accent>
    </>
  ),
  // Flight validation: a flight report stamped « approved ».
  flightValidation: (
    <>
      <path d="M8 6H36V42H8Z" />
      <path d="M14 14H30M14 20H26M14 26H30" strokeOpacity={0.6} />
      <Accent>
        <circle cx={46} cy={30} r={11} fill="currentColor" fillOpacity={0.1} />
        <path d="M41 30 45 34 52 26" strokeWidth={2} />
      </Accent>
    </>
  ),
  // Rankings: a podium.
  rankings: (
    <>
      <path d="M10 42V30H26V42M46 42V34H62V42M6 42H66" />
      <Accent>
        <path d="M26 42V20H46V42" fill="currentColor" fillOpacity={0.15} />
        <path d="M36 6 38 10 42.5 10.5 39 13.5 40 18 36 15.8 32 18 33 13.5 29.5 10.5 34 10Z" />
      </Accent>
    </>
  ),
  // Shared management: three airlines tied to one team.
  sharedManagement: (
    <>
      <Ground y={40} />
      <Tail x={6} y={40} scale={0.7} />
      <Tail x={29} y={40} scale={0.7} accent />
      <Tail x={52} y={40} scale={0.7} />
      <Accent>
        <path d="M12 12H60M36 6V12M12 12V16M60 12V16" />
      </Accent>
    </>
  ),
  // Group statistics: the figures of every airline in one chart.
  groupStats: (
    <>
      <circle cx={24} cy={24} r={16} />
      <Accent>
        <path d="M24 24V8A16 16 0 0 1 39 29Z" fill="currentColor" fillOpacity={0.3} />
      </Accent>
      <path d="M24 24 13 36" />
      <Tail x={46} y={40} scale={0.8} />
    </>
  ),
} satisfies Record<string, ReactNode>;
