import {
  landingSummary,
  type FlightAlert,
  type LogbookLastFlight,
  type LogbookSummary,
} from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { dailyStreak } from "../profiles/streak.ts";
import { sum } from "../profiles/sum.ts";
import { flyingDays } from "./flying-days.ts";

const DAY_MS = 86_400_000;
const LANDINGS_COMPARED = 10;
const RECENT_LANDINGS = 30;
const RECENT_FLIGHTS = 4;
const WORK_ON_FLIGHTS = 10;
const CALENDAR_WEEKS = 17;

/** A closed flight and its final landing (null when it never touched down). */
interface Landed {
  flight: SummaryWithEvents;
  at: Date;
  landing: ReturnType<typeof landingSummary>;
}

const mean = (values: readonly number[]) =>
  values.length === 0 ? null : sum(values) / values.length;

const airborne = (flights: readonly Landed[]) =>
  sum(flights.map((f) => f.flight.summary.times.airborneS ?? 0));

/** Airborne time of the calendar month (UTC) of `now`, and of the month before. */
function monthAirborne(flights: readonly Landed[], now: Date) {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const before = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  const inRange = (from: number, to: number) =>
    flights.filter((f) => f.at.getTime() >= from && f.at.getTime() < to);
  return {
    current: airborne(inRange(start, Infinity)),
    previous: airborne(inRange(before, start)),
  };
}

/** Measured touchdowns, newest first. */
function touchdowns(flights: readonly Landed[]): { at: Date; vs: number }[] {
  return flights.flatMap(({ at, landing }) =>
    landing?.touchdownVs == null ? [] : [{ at, vs: landing.touchdownVs }],
  );
}

/** Share of clean final landings among the flights that landed between two times. */
function cleanShare(flights: readonly Landed[], from: number, to: number): number | null {
  const landed = flights.filter((f) => f.landing && f.at.getTime() >= from && f.at.getTime() < to);
  if (landed.length === 0) return null;
  const clean = landed.filter((f) => f.landing?.bounces === 0 && f.landing.goArounds === 0);
  return clean.length / landed.length;
}

/** « À travailler »: bounces, alerts and go-arounds of the last flights that landed. */
function workOn(flights: readonly Landed[]): LogbookSummary["workOn"] {
  const last = flights.filter((f) => f.landing).slice(0, WORK_ON_FLIGHTS);
  const alerts = new Set<FlightAlert>(last.flatMap((f) => f.flight.summary.alerts));
  return {
    flights: last.length,
    bouncedLandings: last.filter((f) => (f.landing?.bounces ?? 0) > 0).length,
    alertFlights: last.filter((f) => f.flight.summary.alerts.length > 0).length,
    alerts: [...alerts],
    goArounds: sum(last.map((f) => f.landing?.goArounds ?? 0)),
  };
}

type LastTrack = { distanceNm: number; fuelUsedKg: number | null } | null;

const NO_LANDING = { touchdownVs: null, bounces: 0, goArounds: 0 };
const NO_TRACK = { distanceNm: null, fuelUsedKg: null };

/** « Dernier vol »: the flight, its final landing, and what its trajectory measured. */
function lastFlightOf({ flight, landing }: Landed, track: LastTrack): LogbookLastFlight {
  const { touchdownVs, bounces, goArounds } = landing ?? NO_LANDING;
  const { distanceNm, fuelUsedKg } = track ?? NO_TRACK;
  return { flight: flight.summary, touchdownVs, bounces, goArounds, distanceNm, fuelUsedKg };
}

/**
 * Page Résumé of the private logbook, from every closed flight of the pilot (newest first) and the
 * length and fuel of the last flight's trajectory (null without trajectory).
 */
export function logbookSummary(
  closed: readonly SummaryWithEvents[],
  lastTrack: LastTrack,
  now: Date,
): LogbookSummary {
  const flights: Landed[] = closed.map((flight) => ({
    flight,
    at: new Date(flight.summary.openedAt),
    landing: landingSummary(flight.events),
  }));
  const measured = touchdowns(flights);
  const day = now.getTime();
  const last = flights[0];
  return {
    lastFlight: last ? lastFlightOf(last, lastTrack) : null,
    monthAirborneS: monthAirborne(flights, now),
    touchdownAverage: {
      current: mean(measured.slice(0, LANDINGS_COMPARED).map((t) => t.vs)),
      previous: mean(measured.slice(LANDINGS_COMPARED, 2 * LANDINGS_COMPARED).map((t) => t.vs)),
    },
    cleanLandingShare: {
      current: cleanShare(flights, day - 30 * DAY_MS, Infinity),
      previous: cleanShare(flights, day - 60 * DAY_MS, day - 30 * DAY_MS),
    },
    streakDays: dailyStreak(
      flights.map((f) => f.at),
      now,
    ),
    recentLandings: measured
      .slice(0, RECENT_LANDINGS)
      .reverse()
      .map((t) => ({ at: t.at.toISOString(), touchdownVs: t.vs })),
    flyingDays: flyingDays(closed, now, CALENDAR_WEEKS),
    workOn: workOn(flights),
    recentFlights: flights.slice(0, RECENT_FLIGHTS).map((f) => ({
      flight: f.flight.summary,
      touchdownVs: f.landing?.touchdownVs ?? null,
    })),
  };
}
