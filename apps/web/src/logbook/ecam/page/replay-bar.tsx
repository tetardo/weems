"use client";

import { useTranslations } from "next-intl";
import type { PointerEvent } from "react";
import { REPLAY_SPEEDS, type useReplay } from "./use-replay.ts";

/** ×10, ×30, ×60: the one chosen in cyan. */
function Speeds({ replay }: { replay: ReturnType<typeof useReplay> }) {
  return REPLAY_SPEEDS.map((speed) => (
    <button
      key={speed}
      type="button"
      onClick={() => replay.setSpeed(speed)}
      aria-pressed={replay.speed === speed}
      className={`cursor-pointer border px-1.5 text-[12px] leading-5 ${replay.speed === speed ? "border-ecam-cyan text-ecam-cyan" : "border-ecam-edge text-ecam-dim"}`}
    >
      ×{speed}
    </button>
  ));
}

/** ▶ / ❚❚, speeds, progress (a click jumps there) and times (maquette v3, validated 14/11). */
export function ReplayBar({
  replay,
  held,
  count,
  times,
  onJump,
}: {
  replay: ReturnType<typeof useReplay>;
  held: number | null;
  count: number;
  times: { now: string; end: string };
  onJump: (cell: number) => void;
}) {
  const t = useTranslations("Logbook.ecamPage");
  const progress = held === null || count < 2 ? 0 : (held / (count - 1)) * 100;
  const jump = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    onJump(Math.round(share * (count - 1)));
  };
  return (
    <div className="mb-2.5 flex h-[26px] items-center gap-2.5">
      <button
        type="button"
        onClick={replay.toggle}
        title={t("playHint")}
        className="cursor-pointer border border-ecam-white px-2.5 leading-[22px] font-bold"
      >
        {replay.playing ? "❚❚" : "▶"}
      </button>
      <Speeds replay={replay} />
      <div
        onPointerDown={jump}
        className="relative h-1 flex-1 cursor-pointer bg-ecam-off"
        role="presentation"
      >
        <i className="absolute inset-y-0 left-0 bg-ecam-green" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[12px] whitespace-nowrap">
        {times.now} <span className="text-ecam-dim">/ {times.end}</span>
      </span>
    </div>
  );
}
