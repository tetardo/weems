"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AirportIcon, CloseIcon } from "../ui/icons.ts";
import { useSlashShortcut } from "../ui/use-slash-shortcut.ts";
import { airportCode } from "./board-rows.ts";

type Choose = (code: string | null) => void;

/** A code typed: applied once complete or on Enter; Escape or × shows every airport again. */
function AirportInput({ airport, onChoose }: { airport: string | null; onChoose: Choose }) {
  const t = useTranslations("Boarding.filter");
  const [typed, setTyped] = useState(airport ?? "");
  const input = useRef<HTMLInputElement>(null);
  useSlashShortcut(input);
  useEffect(() => setTyped(airport ?? ""), [airport]);

  const type = (value: string) => {
    setTyped(value);
    const code = airportCode(value);
    if (code?.length === 4) onChoose(code);
    if (value.trim() === "") onChoose(null);
  };
  return (
    <label className="flex h-9 w-56 items-center gap-2 rounded-control border border-line bg-surface px-2.5 focus-within:border-accent">
      <AirportIcon size={16} className="text-muted" aria-hidden="true" />
      <span className="sr-only">{t("label")}</span>
      <input
        ref={input}
        type="search"
        value={typed}
        maxLength={4}
        placeholder={t("placeholder")}
        onChange={(event) => type(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onChoose(airportCode(typed));
          if (event.key === "Escape") type("");
        }}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase outline-none placeholder:font-sans placeholder:normal-case focus-visible:outline-none"
      />
      {airport ? (
        <button
          type="button"
          onClick={() => type("")}
          aria-label={t("clear")}
          className="text-muted hover:text-ink"
        >
          <CloseIcon size={15} aria-hidden="true" />
        </button>
      ) : (
        <kbd className="rounded-tag border border-line px-1.5 text-[11px] text-muted max-md:hidden">
          /
        </kbd>
      )}
    </label>
  );
}

/** The airport of the boards: a code typed, or one of the busiest airports in one click. */
export function AirportFilter({
  airport,
  busiest,
  onChoose,
}: {
  airport: string | null;
  busiest: readonly { icao: string; count: number }[];
  onChoose: Choose;
}) {
  const t = useTranslations("Boarding.filter");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AirportInput airport={airport} onChoose={onChoose} />
      {busiest.length > 0 && (
        <span className="text-xs text-muted max-lg:hidden">{t("busiest")}</span>
      )}
      {busiest.map(({ icao, count }) => (
        <button
          key={icao}
          type="button"
          aria-pressed={airport === icao}
          onClick={() => onChoose(airport === icao ? null : icao)}
          className={`flex h-7 items-center gap-1.5 rounded-control border px-2 font-mono text-xs font-semibold ${
            airport === icao
              ? "border-accent bg-accent/15 text-ink"
              : "border-line text-ink hover:border-accent"
          }`}
        >
          {icao}
          <span className="font-normal text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
