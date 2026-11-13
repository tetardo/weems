"use client";

import { useCallback, useEffect, useRef } from "react";
import { siteAudio, wakeSoundOnTouch } from "../site/sound-setting.ts";

/** One flap falling: a very short burst of noise, high-passed so it clicks. */
function click(audio: AudioContext, at: number): void {
  const length = Math.floor(audio.sampleRate * 0.012);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  const gain = audio.createGain();
  gain.gain.value = 0.08;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(at);
}

const CLICK_EVERY_S = 0.035;

/**
 * Rattle of the split-flap cells while they turn (spec web Boarding): off unless the visitor turns
 * it on. Several cells turning together make one rattle, never a pile of them.
 */
export function useFlapSound(enabled: boolean): (durationMs: number) => void {
  const audio = useRef<AudioContext | null>(null);
  const busyUntil = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    audio.current = siteAudio();
    // On before this page opened: the browser keeps it muted until the visitor touches the page.
    return wakeSoundOnTouch();
  }, [enabled]);

  return useCallback(
    (durationMs: number) => {
      const context = audio.current;
      if (!enabled || !context) return;
      const start = Math.max(context.currentTime, busyUntil.current);
      const end = context.currentTime + durationMs / 1000;
      for (let at = start; at < end; at += CLICK_EVERY_S) click(context, at);
      busyUntil.current = Math.max(busyUntil.current, end);
    },
    [enabled],
  );
}
