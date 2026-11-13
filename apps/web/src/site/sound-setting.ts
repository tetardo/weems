"use client";

import { useSyncExternalStore } from "react";

/** Key of the sound choice in the browser's local storage: off unless the visitor turns it on. */
const SOUND_STORAGE_KEY = "weems-sound";
/** Tells the other components of the page that the choice changed (`storage` only fires in other tabs). */
const SOUND_EVENT = "weems-sound-change";

/** Sound of the site on? Storage may be refused (private mode): then off. */
function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

let audio: AudioContext | null = null;

/**
 * The one audio output of the page, kept across page changes. Browsers start it muted unless it is
 * created or resumed during a click or a key press: the sound button does it in its click, and
 * `wakeSoundOnTouch` at the next touch when the sound was already on as the page opened.
 */
export function siteAudio(): AudioContext {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

/** Wakes the sound at the next click or key press on the page; returns how to stop waiting. */
export function wakeSoundOnTouch(): () => void {
  const wake = () => siteAudio();
  const events = ["pointerdown", "keydown"] as const;
  for (const event of events) window.addEventListener(event, wake, { once: true });
  return () => {
    for (const event of events) window.removeEventListener(event, wake);
  };
}

/** Remembers the choice and tells every component listening, in this tab and the others. */
export function writeSound(on: boolean): void {
  // In the click itself, while the browser still allows sound to start.
  if (on) siteAudio();
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage refused: nothing remembered, the page stays silent.
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The sound switch of the bar (next to the theme), shared by the whole site: today the rattle of
 * the Boarding flaps. Silent on the server and until the page has read the choice.
 */
export function useSound(): boolean {
  return useSyncExternalStore(subscribe, readSound, () => false);
}
