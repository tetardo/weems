import type { ReactNode } from "react";
import { Accent, Ground, Panel, PlaneSide, PlaneTop } from "./kit.tsx";

const CALENDAR_CELLS = [0, 1, 2, 3, 4, 5].flatMap((col) => [0, 1, 2].map((row) => ({ col, row })));
const FILLED = new Set(["0-1", "1-0", "1-2", "2-1", "3-0", "3-1", "4-2", "5-1"]);

/** Group « Carnet de vol ». */
export const LOGBOOK_ILLUSTRATIONS = {
  // The summary: a consistency calendar, flying days filled in.
  logbookSummary: (
    <>
      <Panel x={8} y={6} w={56} h={36} />
      <path d="M8 14H64" />
      {CALENDAR_CELLS.map(({ col, row }) =>
        FILLED.has(`${col}-${row}`) ? (
          <Accent key={`${col}-${row}`}>
            <rect
              x={13 + col * 8}
              y={18 + row * 7.5}
              width={6}
              height={5}
              rx={1}
              fill="currentColor"
              fillOpacity={0.35}
            />
          </Accent>
        ) : (
          <rect
            key={`${col}-${row}`}
            x={13 + col * 8}
            y={18 + row * 7.5}
            width={6}
            height={5}
            rx={1}
            strokeOpacity={0.4}
          />
        ),
      )}
    </>
  ),
  // The flight sheet: route on top, altitude profile below.
  flightDetail: (
    <>
      <Ground y={42} />
      <Accent>
        <path d="M8 42C14 42 16 22 24 18H48C56 22 58 42 64 42" />
        <circle cx={8} cy={42} r={1.8} fill="currentColor" />
        <circle cx={64} cy={42} r={1.8} fill="currentColor" />
      </Accent>
      <PlaneSide x={30} y={12} scale={0.75} />
      <path d="M10 8 20 6M52 6 62 8" strokeOpacity={0.4} strokeDasharray="2 2" />
    </>
  ),
  // The flight bands: stacked recorder traces.
  flightBands: (
    <>
      <path d="M6 10H66M6 22H66M6 34H66" strokeOpacity={0.2} />
      <Accent>
        <path d="M6 12C14 12 16 6 24 6S40 6 46 8 58 12 66 12" />
      </Accent>
      <path d="M6 24C12 24 14 18 20 18S36 22 44 20 58 26 66 24" />
      <path d="M6 38H18L22 32H44L48 38H66" strokeOpacity={0.7} />
    </>
  ),
  // Notes and tags: a page with a folded corner and a tag.
  flightNotes: (
    <>
      <path d="M12 6H40L48 14V42H12Z" />
      <path d="M40 6V14H48M18 22H40M18 28H36" />
      <Accent>
        <path d="M44 30H58L64 36 58 42H44Z" fill="currentColor" fillOpacity={0.15} />
        <circle cx={49} cy={36} r={1.4} />
      </Accent>
    </>
  ),
  // Basic statistics: a bar chart with an aircraft climbing over it.
  basicStats: (
    <>
      <Ground y={42} />
      <path
        d="M12 42V30M22 42V24M32 42V32M42 42V18M52 42V26"
        strokeWidth={4}
        strokeOpacity={0.35}
      />
      <Accent>
        <path d="M12 26 22 20 32 28 42 14 52 22" />
      </Accent>
      <PlaneSide x={52} y={8} rotate={-15} scale={0.6} />
    </>
  ),
  // The statistics period: a calendar with a span across the months.
  statsPeriod: (
    <>
      <Panel x={10} y={8} w={52} h={34} />
      <path d="M10 16H62M20 4V10M52 4V10" />
      <Accent>
        <path d="M18 29H54M22 25 18 29 22 33M50 25 54 29 50 33" />
      </Accent>
    </>
  ),
  // To work on: a bounced landing on the runway.
  workOnBasic: (
    <>
      <Ground y={40} />
      <path d="M10 44H62" strokeDasharray="4 4" strokeOpacity={0.4} />
      <Accent>
        <path d="M4 20C14 24 20 38 26 40 30 32 34 32 38 40" strokeDasharray="2 2.5" />
      </Accent>
      <PlaneSide x={42} y={34} scale={0.7} />
    </>
  ),
  // Goals: a dashed route to a flag.
  goals: (
    <>
      <Ground y={42} />
      <PlaneTop x={12} y={34} rotate={45} scale={0.7} />
      <Accent>
        <path d="M18 30C30 22 40 34 52 20" strokeDasharray="2 3" />
        <path d="M56 42V8L66 12 56 16" fill="currentColor" fillOpacity={0.2} />
      </Accent>
    </>
  ),
} satisfies Record<string, ReactNode>;
