"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { rollStep, toCells } from "./flap-roll.ts";

/** Time between two flaps of a turning cell. */
const STEP_MS = 40;

/** Sound of the board (use-flap-sound.ts); silent unless the visitor turns it on. */
export const FlapSoundContext = createContext<(durationMs: number) => void>(() => undefined);

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The cells shown for `text`: when it changes, each cell turns forward through the drum until it
 * shows its new character, as on an airport board. At once if the visitor asks for less motion.
 */
function useRolledCells(text: string, width: number): string[] {
  const [cells, setCells] = useState(() => toCells("", width));
  const shown = useRef(cells);
  const rattle = useContext(FlapSoundContext);

  useEffect(() => {
    const goal = toCells(text, width);
    if (reducedMotion()) {
      shown.current = goal;
      setCells(goal);
      return;
    }
    const timer = setInterval(() => {
      const step = rollStep(shown.current, goal);
      if (step.moved === 0) {
        clearInterval(timer);
        return;
      }
      rattle(STEP_MS);
      shown.current = step.cells;
      setCells(step.cells);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [text, width, rattle]);

  return cells;
}

const TONE = { ink: "", title: "text-board-title" } as const;

/** A word in split-flap cells (callsign, airport code). Screen readers read `text` once. */
export function FlapText({
  text,
  width,
  tone = "ink",
}: {
  text: string;
  width: number;
  tone?: keyof typeof TONE;
}) {
  const cells = useRolledCells(text, width);
  return (
    <span className="inline-flex gap-[2px] font-mono font-bold">
      <span className="sr-only">{text}</span>
      {cells.map((cell, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`flap h-5 w-[11px] text-[11px] sm:h-6 sm:w-[13px] sm:text-[12.5px] ${cell === " " ? "text-transparent" : TONE[tone]}`}
        >
          {cell === " " ? "·" : cell}
        </span>
      ))}
    </span>
  );
}
