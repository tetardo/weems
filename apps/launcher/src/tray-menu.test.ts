import { describe, expect, it } from "vitest";
import type { LauncherState, Row } from "./launcher-state.ts";
import { trayMenu, trayTitle } from "./tray-menu.ts";

const row = (id: Row["id"], state: Row["state"]): Row => ({
  id,
  state,
  port: 3000,
  since: null,
  note: null,
});
const stateWith = (states: Row["state"][], busy: string | null = null): LauncherState => ({
  rows: (["db", "api", "site", "console"] as const).map((id, index) =>
    row(id, states[index] ?? "stopped"),
  ),
  overview: null,
  busy,
  notice: null,
  tab: "console",
  logs: [],
});
const labels = (state: LauncherState) => trayMenu(state).map((item) => item.label);

describe("trayTitle", () => {
  it("counts the rows running, with a coloured dot", () => {
    expect(trayTitle(stateWith(["running", "running", "running", "running"]))).toBe("🟢 Weems 4/4");
    expect(trayTitle(stateWith([]))).toBe("⚪ Weems 0/4");
    expect(trayTitle(stateWith(["running", "error"]))).toBe("🔴 Weems 1/4");
    expect(trayTitle(stateWith([], "Démarrage de Weems…"))).toBe("🟠 Weems 0/4");
  });
});

describe("trayMenu", () => {
  it("offers to start everything when nothing runs", () => {
    const menu = labels(stateWith([]));
    expect(menu[0]).toBe("Tout est arrêté");
    expect(menu).toContain("Tout démarrer");
    expect(menu).not.toContain("Tout redémarrer");
  });

  it("offers to restart when something runs, and waits while the launcher is busy", () => {
    const busy = trayMenu(stateWith(["running"], "Arrêt de Weems…"));
    expect(busy[0]?.label).toBe("Arrêt de Weems…");
    const restart = busy.find((item) => item.label === "Tout redémarrer");
    expect(restart?.enabled).toBe(false);
    expect(busy.at(-1)).toMatchObject({ label: "Quitter (arrête tout)", command: "quit" });
  });
});
