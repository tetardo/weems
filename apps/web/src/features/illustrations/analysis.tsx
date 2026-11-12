import type { ReactNode } from "react";
import { Accent, Ground, Panel, PlaneSide, PlaneTop } from "./kit.tsx";

/** Group « Analyser ses vols ». */
export const ANALYSIS_ILLUSTRATIONS = {
  // The approach: glide path with the 1,000 and 500 ft gates down to the runway.
  approachAnalysis: (
    <>
      <path d="M40 42H70" strokeWidth={2.4} strokeOpacity={0.5} />
      <Accent>
        <path d="M20 20 44 41" strokeDasharray="2 3" />
        <path d="M26 18V32M36 26V40" />
      </Accent>
      <PlaneSide x={3} y={7} rotate={38} scale={0.75} />
    </>
  ),
  // To work on, in detail: the flare under a magnifying glass.
  workOnDetailed: (
    <>
      <Ground y={40} />
      <path d="M4 18C16 22 22 36 34 40" />
      <Accent>
        <circle cx={30} cy={34} r={10} />
        <path d="M37 41 46 46" strokeWidth={2.4} />
        <path d="M23 31C27 34 30 37 36 38" />
      </Accent>
      <PlaneSide x={46} y={34} scale={0.6} />
    </>
  ),
  // Marks on the bands: a trace with the moment to review highlighted.
  flightBandsMarks: (
    <>
      <path d="M6 30C12 30 14 22 20 22S30 36 36 36 44 14 50 14 60 28 66 28" />
      <Accent>
        <rect
          x={38}
          y={8}
          width={16}
          height={34}
          rx={2}
          fill="currentColor"
          fillOpacity={0.12}
          strokeDasharray="2 2"
        />
        <path d="M46 4V8" />
      </Accent>
    </>
  ),
  // Planned and actual: fuel, planned (dashed) against burnt (solid).
  plannedVsActual: (
    <>
      <path d="M12 42V12M30 42V18" strokeWidth={7} strokeOpacity={0.15} />
      <path d="M8 12H16M26 18H34" strokeDasharray="2 2" />
      <Accent>
        <path d="M12 42V16M30 42V22" strokeWidth={3} />
        <path
          d="M54 12C54 12 46 22 46 28A8 8 0 0 0 62 28C62 22 54 12 54 12Z"
          fill="currentColor"
          fillOpacity={0.15}
        />
      </Accent>
    </>
  ),
  // You and the community: a distribution with your position on it.
  community: (
    <>
      <Ground y={42} />
      <path d="M6 42C18 42 24 10 36 10S54 42 66 42" />
      <Accent>
        <path d="M48 30V42" />
        <circle cx={48} cy={27} r={3} fill="currentColor" fillOpacity={0.3} />
      </Accent>
    </>
  ),
  // Compare two flights: two altitude profiles one over the other.
  compareFlights: (
    <>
      <Ground y={42} />
      <path d="M6 42C12 42 14 16 22 14H50C58 16 60 42 66 42" strokeOpacity={0.6} />
      <Accent>
        <path d="M6 42C14 42 16 22 24 20H46C54 22 56 42 66 42" strokeDasharray="3 2.5" />
      </Accent>
    </>
  ),
  // Same aircraft: one aircraft, each flight a dot.
  sameAircraftComparison: (
    <>
      <PlaneTop x={16} y={24} rotate={90} scale={1.1} />
      <path d="M32 40H66" strokeOpacity={0.4} />
      <Accent>
        <circle cx={38} cy={30} r={1.8} />
        <circle cx={45} cy={24} r={1.8} />
        <circle cx={52} cy={27} r={1.8} />
        <circle cx={60} cy={16} r={2.6} fill="currentColor" />
      </Accent>
    </>
  ),
  // Trends by category: a rising line, an aircraft at each step.
  categoryTrends: (
    <>
      <Ground y={42} />
      <Accent>
        <path d="M6 36 22 30 36 32 52 18 66 12" />
      </Accent>
      <PlaneTop x={22} y={22} rotate={60} scale={0.45} />
      <PlaneTop x={52} y={10} rotate={60} scale={0.45} />
    </>
  ),
  // Time per phase: one bar cut into taxi, climb, cruise, approach.
  phaseTime: (
    <>
      <rect x={6} y={20} width={60} height={9} rx={2} />
      <path d="M14 20V29M26 20V29M52 20V29" />
      <Accent>
        <rect
          x={26}
          y={20}
          width={26}
          height={9}
          fill="currentColor"
          fillOpacity={0.3}
          stroke="none"
        />
        <circle cx={39} cy={10} r={5} />
        <path d="M39 7V10L41 11" />
      </Accent>
      <path d="M6 38H66" strokeOpacity={0.3} strokeDasharray="2 3" />
    </>
  ),
  // Good practices: a badge with wings and a tick.
  goodPractices: (
    <>
      <path d="M6 22C14 20 20 22 26 24M66 22C58 20 52 22 46 24M10 28C16 27 21 28 26 30M62 28C56 27 51 28 46 30" />
      <Accent>
        <circle cx={36} cy={24} r={11} fill="currentColor" fillOpacity={0.12} />
        <path d="M31 24 35 28 42 20" strokeWidth={2} />
      </Accent>
    </>
  ),
  // Export: a report going out as a file.
  export: (
    <>
      <Panel x={8} y={6} w={30} h={36} />
      <path d="M14 14H32M14 20H28M14 26H32M14 32H24" strokeOpacity={0.6} />
      <Accent>
        <path d="M54 8V30M46 22 54 30 62 22M46 38H62" strokeWidth={1.8} />
      </Accent>
    </>
  ),
} satisfies Record<string, ReactNode>;
