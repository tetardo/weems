import type { LauncherCommand } from "../launcher-state.ts";
import { confirmAction, type Warning } from "./confirm-dialog.ts";

/**
 * « Tout démarrer / arrêter / redémarrer », side by side in the top bar (Greg, 13/11), the last two
 * as icons and after a warning. Written in
 * index.html once; the state only shows or hides them.
 */

type AllCommand = Extract<LauncherCommand, { type: "start-all" | "stop-all" | "restart-all" }>;

/** « Tout démarrer » goes without asking: nothing runs. */
const WARNINGS: Partial<Record<AllCommand["type"], Warning>> = {
  "stop-all": {
    title: "Tout arrêter ?",
    text: "La base, l'API, le site et la console s'arrêtent, le trafic et l'activité simulés aussi. Les données restent dans la base.",
    confirm: "Tout arrêter",
  },
  "restart-all": {
    title: "Tout redémarrer ?",
    text: "Tout s'arrête puis repart, environ une minute : le site, l'API et la console ne répondent pas pendant ce temps.",
    confirm: "Tout redémarrer",
  },
};

const allButtons = () => document.querySelectorAll<HTMLButtonElement>("[data-all]");

export function setupHeadButtons(send: (command: LauncherCommand) => void): void {
  for (const button of allButtons()) {
    button.addEventListener("click", async () => {
      const command = { type: button.dataset["all"] } as AllCommand;
      const warning = WARNINGS[command.type];
      if (warning && !(await confirmAction(warning))) return;
      send(command);
    });
  }
}

/** « Tout démarrer » when nothing runs, « arrêter » and « redémarrer » otherwise; off while busy. */
export function renderHeadButtons(running: number, busy: boolean): void {
  for (const button of allButtons()) {
    button.hidden = (button.dataset["all"] === "start-all") !== (running === 0);
    button.disabled = busy;
  }
}
