import type { LifecycleStatus } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { consoleRow, rowsOf, runningCount } from "./rows.ts";

const idle = { running: false, pid: null, startedAt: null, exitCode: null };
const ours = { running: true, pid: 42, startedAt: "2026-11-13T06:00:00.000Z", exitCode: null };

describe("consoleRow", () => {
  it("is running when it answers, with the start of the launcher's own process", () => {
    const row = consoleRow({ answers: true, process: ours, stopAsked: false });
    expect(row).toMatchObject({ state: "running", since: ours.startedAt, note: null });
  });

  it("names a console started elsewhere (start.sh)", () => {
    const row = consoleRow({ answers: true, process: idle, stopAsked: false });
    expect(row).toMatchObject({ state: "running", note: "Lancée hors du lanceur." });
  });

  it("is starting while its process runs without answering yet", () => {
    expect(consoleRow({ answers: false, process: ours, stopAsked: false }).state).toBe("starting");
  });

  it("shows a failed start, but not the end of a stop asked by the launcher", () => {
    const ended = { ...idle, exitCode: 1 };
    expect(consoleRow({ answers: false, process: ended, stopAsked: false }).state).toBe("error");
    expect(consoleRow({ answers: false, process: ended, stopAsked: true }).state).toBe("stopped");
  });
});

describe("rowsOf", () => {
  it("shows the three services stopped when the console does not answer", () => {
    const rows = rowsOf(null, { answers: false, process: idle, stopAsked: false });
    expect(rows.map((row) => [row.id, row.state, row.port])).toEqual([
      ["db", "stopped", 5432],
      ["api", "stopped", 3000],
      ["site", "stopped", 3001],
      ["console", "stopped", 3002],
    ]);
    expect(runningCount(rows)).toBe(0);
  });

  it("takes the services from the console, with a note for a launch made elsewhere", () => {
    const service = { port: 3000, since: null, error: null } as const;
    const status: LifecycleStatus = {
      dockerAvailable: true,
      logs: null,
      services: [
        { ...service, id: "db", port: 5432, state: "running", runner: "docker" },
        { ...service, id: "api", state: "running", runner: "outside" },
        { ...service, id: "site", port: 3001, state: "error", runner: null, error: "Port pris" },
      ],
    };
    const rows = rowsOf(status, { answers: true, process: ours, stopAsked: false });
    expect(rows[1]?.note).toBe("Lancé hors de la console : arrêtez-le dans son terminal.");
    expect(rows[2]).toMatchObject({ state: "error", note: "Port pris" });
    expect(runningCount(rows)).toBe(3);
  });
});
