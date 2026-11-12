import { z } from "zod";
import { AircraftCategory } from "./aircraft-class.ts";
import { FlightView } from "./flights.ts";
import { FlightSummary } from "./flight-list.ts";
import { IcaoCode, UtcTimestamp } from "./common.ts";
import { Latitude, Longitude } from "../telemetry/common.ts";

/**
 * Public profile of a pilot (spec J4 profil public). Public formats list their fields one by one:
 * a field added later to a private format never becomes public by accident.
 */

/** Address of a public profile: /pilots/{handle}. 3 to 30 of a-z 0-9 -, no dash at either end. */
export const PilotHandle = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, "3 to 30 of a-z, 0-9 and -, no dash at either end.");

/** ISO 3166-1 alpha-2 country code (FR). */
export const CountryCode = z.string().regex(/^[A-Z]{2}$/);

/** Experience declared by the pilot; nothing checks it. */
export const PilotLevel = z.enum(["beginner", "intermediate", "advanced", "realPilot"]);
export type PilotLevel = z.infer<typeof PilotLevel>;

/** VATSIM member id (CID). */
export const VatsimId = z.string().regex(/^\d{6,8}$/);
/** IVAO member id (VID). */
export const IvaoId = z.string().regex(/^\d{5,7}$/);
/** Instagram user name, without @: 1 to 30 of letters, digits, dot and underscore. */
export const InstagramName = z.string().regex(/^[A-Za-z0-9._]{1,30}$/);
/** Facebook user name or numeric profile id: 1 to 50 of letters, digits and dot. */
export const FacebookName = z.string().regex(/^[A-Za-z0-9.]{1,50}$/);
/** SimBrief user name or pilot id. Never public: used by the tracker to import flight plans. */
export const SimbriefId = z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/);

/** Fields the pilot fills in, all optional. */
const ProfileFields = z.object({
  country: CountryCode.nullable(),
  /** Home airport, shown in the header. */
  homeIcao: IcaoCode.nullable(),
  level: PilotLevel.nullable(),
  vatsimId: VatsimId.nullable(),
  ivaoId: IvaoId.nullable(),
  /** Account names only: the site builds the links, so a public page never shows a free link. */
  instagram: InstagramName.nullable(),
  facebook: FacebookName.nullable(),
  simbriefId: SimbriefId.nullable(),
});

/** PUT /v1/me/profile: the whole profile. Publishing needs a handle. */
export const ProfileUpdate = ProfileFields.extend({
  isPublic: z.boolean(),
  handle: PilotHandle.nullable(),
});
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;

/** GET /v1/me/profile: the pilot's own profile, public or not. */
export const MyProfile = ProfileUpdate.extend({
  /** Handle proposed from the pilot's name when none is chosen yet. */
  suggestedHandle: PilotHandle,
  /** When the profile was last made public; null if never. */
  publishedAt: UtcTimestamp.nullable(),
  /** When the photo was last changed; null without photo. Version of the photo's address. */
  photoUpdatedAt: UtcTimestamp.nullable(),
});
export type MyProfile = z.infer<typeof MyProfile>;

/** A landing worth showing: where and how soft. */
const NotableLanding = z.object({
  touchdownVs: z.number(),
  airportIcao: IcaoCode.nullable(),
  at: UtcTimestamp,
});

/** Airborne time and number of flights of a group of flights. */
const Experience = z.object({
  airborneS: z.number().nonnegative(),
  flights: z.number().int().nonnegative(),
});

/** One flown category of the block "Expérience par catégorie" (spec J4, aircraft categories). */
export const CategoryExperience = Experience.extend({
  category: AircraftCategory,
  /** The most flown ICAO types (else titles) of the category, at most 3. */
  types: z.array(z.string()).max(3),
  /** As averageTouchdownVs and bestLanding below, within the category. */
  averageTouchdownVs: z.number().nullable(),
  bestLanding: NotableLanding.nullable(),
});
export type CategoryExperience = z.infer<typeof CategoryExperience>;

/** Statistics of the public flights (closed and not hidden). */
export const PilotStats = z.object({
  flights: z.number().int().nonnegative(),
  airborneS: z.number().nonnegative(),
  blockS: z.number().nonnegative(),
  /** Distinct departure and arrival airports. */
  airports: z.number().int().nonnegative(),
  /** Distinct aircraft (by ICAO type, else title). */
  aircraft: z.number().int().nonnegative(),
  favoriteAircraft: z.string().nullable(),
  /** Mean vertical speed at the touchdown of the final landing, ft/min (negative). */
  averageTouchdownVs: z.number().nullable(),
  /** Softest final touchdown. */
  bestLanding: NotableLanding.nullable(),
  longestFlight: z
    .object({
      blockS: z.number().nonnegative(),
      departureIcao: IcaoCode.nullable(),
      arrivalIcao: IcaoCode.nullable(),
    })
    .nullable(),
  goArounds: z.number().int().nonnegative(),
  /**
   * Airborne time by day and by night (sun more than 6° below the horizon, EASA definition),
   * from the trajectories: flights without one count in neither.
   */
  dayS: z.number().nonnegative(),
  nightS: z.number().nonnegative(),
  /** Length of the trajectories, nautical miles: flights without one count for nothing. */
  distanceNm: z.number().nonnegative(),
  /**
   * Weeks in a row (Monday to Sunday, UTC) with at least one flight. The current run still counts
   * while the week before has a flight; `recordWeeks` is the longest run ever.
   */
  streak: z.object({
    currentWeeks: z.number().int().nonnegative(),
    recordWeeks: z.number().int().nonnegative(),
  }),
  /** Final landings with a single touchdown and no go-around, among the flights that landed. */
  cleanLandings: z.object({
    clean: z.number().int().nonnegative(),
    landings: z.number().int().nonnegative(),
  }),
  /**
   * Experience by aircraft category, most flown first (flights without a category left out), and
   * single- and multi-engine time as in the EASA logbook (SE / ME; engineless aircraft in neither).
   */
  experience: z.object({
    categories: z.array(CategoryExperience),
    singleEngine: Experience,
    multiEngine: Experience,
  }),
});
export type PilotStats = z.infer<typeof PilotStats>;

/** Photo of a profile: image types the API reads, and upload limit (stored reduced to ~20 KB). */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Upper bounds of the flight duration buckets, hours: < 1, 1-2, 2-4, 4-8, > 8 (block time). */
export const DURATION_BUCKETS_H = [1, 2, 4, 8] as const;
/** Upper bounds of the touchdown buckets, ft/min: soft < 60, normal, firm, hard > 600. */
export const TOUCHDOWN_BUCKETS_FPM = [60, 240, 600] as const;
/** Number of landings on the landing curve of the profile. */
export const RECENT_LANDINGS = 30;

const Count = z.number().int().nonnegative();

/** Data of the charts of a public profile (spec J4 profil public, section Statistiques). */
export const PilotCharts = z.object({
  /** Airborne time of each of the last 12 months, oldest first; month as YYYY-MM (UTC). */
  months: z.array(
    z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), airborneS: z.number().nonnegative() }),
  ),
  /**
   * Takeoffs by weekday (0 = Monday) and hour, in the local time of the place of takeoff:
   * 7 rows of 24 counts.
   */
  takeoffs: z.array(z.array(Count).length(24)).length(7),
  /** Flights per block time bucket (DURATION_BUCKETS_H): 5 counts. */
  durations: z.array(Count).length(DURATION_BUCKETS_H.length + 1),
  /** Final landings per touchdown bucket (TOUCHDOWN_BUCKETS_FPM): 4 counts. */
  touchdowns: z.array(Count).length(TOUCHDOWN_BUCKETS_FPM.length + 1),
  /** Last final touchdowns (RECENT_LANDINGS at most), oldest first. */
  recentLandings: z.array(z.object({ at: UtcTimestamp, touchdownVs: z.number() })),
});
export type PilotCharts = z.infer<typeof PilotCharts>;

/** GET /v1/pilots/{handle} */
export const PublicPilot = z.object({
  handle: PilotHandle,
  name: z.string(),
  country: CountryCode.nullable(),
  homeIcao: IcaoCode.nullable(),
  level: PilotLevel.nullable(),
  vatsimId: VatsimId.nullable(),
  ivaoId: IvaoId.nullable(),
  instagram: InstagramName.nullable(),
  facebook: FacebookName.nullable(),
  memberSince: UtcTimestamp,
  /** Photo at GET /v1/pilots/{handle}/photo; initials otherwise. */
  hasPhoto: z.boolean(),
  /** Fictitious account of the simulated activity: the site shows a badge (development only). */
  fictitious: z.boolean(),
  stats: PilotStats,
  charts: PilotCharts,
});
export type PublicPilot = z.infer<typeof PublicPilot>;

/** One line of a public flight list. */
export const PublicFlightSummary = FlightSummary.pick({
  flightId: true,
  callsign: true,
  aircraftTitle: true,
  aircraftModel: true,
  aircraftClass: true,
  departureIcao: true,
  plannedArrivalIcao: true,
  openedAt: true,
  closedAt: true,
  times: true,
  alerts: true,
}).extend({ touchdownVs: z.number().nullable() });
export type PublicFlightSummary = z.infer<typeof PublicFlightSummary>;

/** GET /v1/pilots/{handle}/flights */
export const PublicFlightList = z.object({
  flights: z.array(PublicFlightSummary),
  nextCursor: z.string().nullable(),
});
export type PublicFlightList = z.infer<typeof PublicFlightList>;

/** GET /v1/pilots/{handle}/flights/{flightId} */
export const PublicFlightView = FlightView.pick({
  flightId: true,
  callsign: true,
  aircraft: true,
  departureIcao: true,
  plannedArrivalIcao: true,
  openedAt: true,
  closedAt: true,
  closeReason: true,
  lastPhase: true,
  aircraftClass: true,
  times: true,
  events: true,
});
export type PublicFlightView = z.infer<typeof PublicFlightView>;

/** GET /v1/pilots: public profiles, for the site map. */
export const PublicPilotIndex = z.object({
  pilots: z.array(z.object({ handle: PilotHandle, updatedAt: UtcTimestamp })),
});
export type PublicPilotIndex = z.infer<typeof PublicPilotIndex>;

/** PUT and GET /v1/flights/{flightId}/visibility: hide a flight from the public profile. */
export const FlightVisibility = z.object({ hiddenOnProfile: z.boolean() });
export type FlightVisibility = z.infer<typeof FlightVisibility>;

const RouteEnd = z.object({ icao: IcaoCode.nullable(), lat: Latitude, lon: Longitude });

/** GET /v1/pilots/{handle}/routes: public flights grouped by route, for the map of the profile. */
export const PilotRoutes = z.object({
  routes: z.array(
    z.object({
      from: RouteEnd,
      to: RouteEnd,
      flights: z.number().int().positive(),
      /** The category most flown on the route: colour of the arc. */
      category: AircraftCategory.nullable(),
    }),
  ),
});
export type PilotRoutes = z.infer<typeof PilotRoutes>;

/** GET /v1/me/profile/hidden-flights: the pilot's flights hidden from the profile, newest first. */
export const HiddenFlights = z.object({
  flights: z.array(
    FlightSummary.pick({
      flightId: true,
      callsign: true,
      departureIcao: true,
      plannedArrivalIcao: true,
      openedAt: true,
    }),
  ),
});
export type HiddenFlights = z.infer<typeof HiddenFlights>;

/** GET /v1/me/profile/handle-check?handle=…: can the pilot take this address? */
export const HandleCheckQuery = z.object({ handle: z.string().max(64) });
export const HandleCheck = z.object({
  handle: z.string(),
  /** Their own current handle counts as available. */
  status: z.enum(["available", "taken", "reserved", "invalid"]),
});
export type HandleCheck = z.infer<typeof HandleCheck>;
