import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type HistoryEntry, HistoryFile, withEntry } from "./history.ts";

const entry = (id: string): HistoryEntry => ({
  id,
  kind: "simulate",
  summary: "10 pilotes · ×10",
  startedAt: "2026-11-11T18:00:00.000Z",
  endedAt: "2026-11-11T18:10:00.000Z",
  outcome: "success",
  detail: null,
});

let dir = "";
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("traffic history", () => {
  it("keeps the 20 newest runs, newest first", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < 25; i += 1) list = withEntry(list, entry(String(i)));
    expect(list).toHaveLength(20);
    expect(list[0]?.id).toBe("24");
  });

  it("writes the file and reads a broken one as empty", async () => {
    dir = mkdtempSync(join(tmpdir(), "weems-console-"));
    const file = new HistoryFile(join(dir, ".data"));
    expect(await file.read()).toEqual([]);
    await file.add(entry("a"));
    expect((await file.read()).map((e) => e.id)).toEqual(["a"]);
    writeFileSync(join(dir, ".data", "traffic-history.json"), "{broken");
    expect(await file.read()).toEqual([]);
  });
});
