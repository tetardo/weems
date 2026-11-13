import type { LauncherCommand } from "../launcher-state.ts";

/**
 * « Tout démarrer / arrêter / redémarrer », side by side in the top bar (Greg, 13/11). Written in
 * index.html once; the state only shows or hides them.
 */

type AllCommand = Extract<LauncherCommand, { type: "start-all" | "stop-all" | "restart-all" }>;

const allButtons = () => document.querySelectorAll<HTMLButtonElement>("[data-all]");

export function setupHeadButtons(send: (command: LauncherCommand) => void): void {
  for (const button of allButtons()) {
    button.addEventListener("click", () => send({ type: button.dataset["all"] } as AllCommand));
  }
}

/** « Tout démarrer » when nothing runs, « arrêter » and « redémarrer » otherwise; off while busy. */
export function renderHeadButtons(running: number, busy: boolean): void {
  for (const button of allButtons()) {
    button.hidden = (button.dataset["all"] === "start-all") !== (running === 0);
    button.disabled = busy;
  }
}
