"use client";

import { useEffect, useRef, useState } from "react";

/** The ECAM screen alone on the display (Greg idea 11): button or F key; Escape leaves (browser). */
export function useFullScreen() {
  const screen = useRef<HTMLElement>(null);
  const [full, setFull] = useState(false);
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void screen.current?.requestFullscreen();
  };
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === screen.current);
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "f" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return;
      toggle();
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  });
  return { screen, full, toggle };
}
