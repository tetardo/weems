import type { ReactNode } from "react";
import { Accent, Panel, PlaneSide, PlaneTop } from "./kit.tsx";

/** Group « Voler et suivre ». */
export const FLY_ILLUSTRATIONS = {
  // The tracker: a PC screen showing the aircraft, sending to Weems.
  tracker: (
    <>
      <Panel x={6} y={8} w={34} h={24} />
      <path d="M18 38H28M23 32V38" />
      <PlaneSide x={12} y={18} scale={0.9} />
      <Accent>
        <path d="M48 14A10 10 0 0 1 48 28M53 10A16 16 0 0 1 53 32M58 6A22 22 0 0 1 58 36" />
      </Accent>
    </>
  ),
  // The live map: a map with two aircraft on their routes.
  liveMap: (
    <>
      <path d="M6 10 24 6 46 12 66 8V40L46 44 24 38 6 42Z" strokeOpacity={0.5} />
      <path d="M24 6V38M46 12V44" strokeOpacity={0.3} />
      <Accent>
        <path d="M10 34C20 30 26 22 34 20" strokeDasharray="2 3" />
        <PlaneTop x={38} y={18} rotate={70} scale={0.6} />
        <path d="M60 36C54 30 54 22 52 16" strokeDasharray="2 3" />
        <PlaneTop x={52} y={13} rotate={-10} scale={0.6} />
      </Accent>
    </>
  ),
  // Boarding: a split-flap board, two rows of letters and their status.
  boarding: (
    <>
      <Panel x={6} y={8} w={60} h={32} />
      <path d="M6 24H66" strokeOpacity={0.4} />
      <path d="M12 14H16M19 14H23M26 14H30M12 30H16M19 30H23M26 30H30" />
      <Accent>
        <path d="M38 14H44M47 14H53M38 30H44M47 30H53" />
        <circle cx={60} cy={14} r={1.5} />
        <circle cx={60} cy={30} r={1.5} />
      </Accent>
    </>
  ),
  // The public profile: a pilot card with wings.
  publicProfile: (
    <>
      <Panel x={10} y={6} w={52} h={36} />
      <circle cx={24} cy={20} r={6} />
      <path d="M16 34C17 29 20 27 24 27S31 29 32 34M38 16H54M38 22H50M38 28H54" />
      <Accent>
        <path d="M18 12C21 13 24 13 24 13S27 13 30 12M24 10V13" />
      </Accent>
    </>
  ),
  // Pilot ranks: pilot wings over three steps, the last one gold.
  pilotRanks: (
    <>
      <path d="M14 40H26V34H38V28H50V22H62" strokeOpacity={0.5} />
      <path d="M20 26C24 24 28 24 30 26M42 26C40 24 44 24 50 26" />
      <Accent>
        <circle cx={36} cy={18} r={5} />
        <path d="M30 18C24 14 18 14 14 16C18 18 24 20 30 20M42 18C48 14 54 14 58 16C54 18 48 20 42 20" />
      </Accent>
    </>
  ),
  // The full history: a stack of logbook pages.
  flightHistory: (
    <>
      <Panel x={20} y={4} w={34} h={30} />
      <Panel x={16} y={9} w={34} h={30} />
      <path d="M12 14V44H46" />
      <Accent>
        <path d="M22 18H44M22 24H44M22 30H38" />
      </Accent>
    </>
  ),
  // The next SimBrief flight: a flight plan, departure to arrival, and « go ».
  simbriefNextFlight: (
    <>
      <Panel x={6} y={6} w={40} h={36} />
      <path d="M12 14H40M12 34H28" strokeOpacity={0.5} />
      <Accent>
        <circle cx={14} cy={25} r={2} />
        <circle cx={38} cy={25} r={2} />
        <path d="M16 25H36" strokeDasharray="2 2.5" />
        <path d="M54 16 66 24 54 32Z" fill="currentColor" fillOpacity={0.2} />
      </Accent>
    </>
  ),
} satisfies Record<string, ReactNode>;
