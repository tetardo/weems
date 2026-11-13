"use client";

import type { Boarding } from "@weems/contrats";
import { useMemo } from "react";
import { aircraftType, airportCode, forAircraft, forAirport } from "./board-rows.ts";
import type { BoardChoices } from "./boarding-table.tsx";
import { useUrlChoice } from "./use-url-choice.ts";

/**
 * The filters of the boards, kept in the address (?airport=LFML&aircraft=A320): the airport and
 * the aircraft type chosen, how to choose them from a row, and the boards they leave.
 */
export function useBoardFilters(board: Boarding | null) {
  const [airport, chooseAirport] = useUrlChoice("airport", airportCode);
  const [aircraft, chooseAircraft] = useUrlChoice("aircraft", aircraftType);
  const choices = useMemo<BoardChoices>(
    () => ({ airport: chooseAirport, aircraft: chooseAircraft }),
    [chooseAirport, chooseAircraft],
  );
  const shown = board && forAircraft(forAirport(board, airport), aircraft);
  return { airport, chooseAirport, aircraft, chooseAircraft, choices, shown };
}
