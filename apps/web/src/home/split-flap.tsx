import { flapDigits } from "./departures.ts";

/** A counter in split-flap digits; `value` null (API unreachable) shows dashes. */
export function SplitFlap({
  value,
  width,
  size = "md",
}: {
  value: number | null;
  width: number;
  size?: "sm" | "md";
}) {
  const cells =
    value === null
      ? Array.from({ length: width }, () => ({ digit: "–", padding: true }))
      : flapDigits(value, width);
  const box = size === "sm" ? "h-7 w-5 text-base" : "h-9 w-[26px] text-xl";
  return (
    <span className="flex gap-[3px] font-mono font-bold" aria-hidden="true">
      {cells.map((cell, index) => (
        <span key={index} className={`flap ${box} ${cell.padding ? "text-board-off" : ""}`}>
          {cell.digit}
        </span>
      ))}
    </span>
  );
}
