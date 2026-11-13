import type { LauncherCommand } from "../launcher-state.ts";

/**
 * The two menus of the top bar (Greg, 13/11): « Ouvrir » (site, console) and « Services » (tout
 * démarrer, arrêter, redémarrer). Written in index.html once, never rebuilt by the state: a menu
 * stays open while the state comes every 2 s.
 */

type AllCommand = Extract<LauncherCommand, { type: "start-all" | "stop-all" | "restart-all" }>;

function closeAll(except?: Element): void {
  for (const menu of document.querySelectorAll(".menu.open")) {
    if (menu !== except) menu.classList.remove("open");
  }
}

export function setupMenus(send: (command: LauncherCommand) => void): void {
  for (const toggle of document.querySelectorAll<HTMLButtonElement>(".menu-toggle")) {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = toggle.closest(".menu");
      closeAll(menu ?? undefined);
      menu?.classList.toggle("open");
    });
  }
  for (const item of document.querySelectorAll<HTMLButtonElement>("[data-all]")) {
    item.addEventListener("click", () => send({ type: item.dataset["all"] } as AllCommand));
  }
  // Any click closes the menus, an item's included (after its own action).
  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });
}

/** « Tout démarrer » when nothing runs, « arrêter » and « redémarrer » otherwise; off while busy. */
export function renderPowerMenu(running: number, busy: boolean): void {
  for (const item of document.querySelectorAll<HTMLButtonElement>("[data-all]")) {
    item.hidden = (item.dataset["all"] === "start-all") !== (running === 0);
  }
  const toggle = document.getElementById("power-toggle") as HTMLButtonElement | null;
  if (toggle) toggle.disabled = busy;
  if (busy) closeAll();
}
