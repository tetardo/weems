import { describe, expect, it } from "vitest";
import type { MigrationFile } from "../../db/migration-journal.ts";
import { migrationStates } from "./migration-states.ts";

const file = (tag: string, createdAtMs: number): MigrationFile => ({
  tag,
  createdAtMs,
  hash: `hash-${tag}`,
});
const files = [file("0000_a", 1000), file("0001_b", 2000), file("0002_c", 3000)];
const recordOf = (f: MigrationFile) => ({ hash: f.hash, createdAtMs: f.createdAtMs });
const stateOf = (states: ReturnType<typeof migrationStates>, tag: string | null) =>
  states.filter((s) => s.tag === tag).map((s) => s.state);

describe("migrationStates", () => {
  it("lists every migration applied, newest first", () => {
    const states = migrationStates(files, files.map(recordOf));
    expect(states.map((s) => s.tag)).toEqual(["0002_c", "0001_b", "0000_a"]);
    expect(states.every((s) => s.state === "applied")).toBe(true);
    expect(states[0]?.createdAt).toBe(new Date(3000).toISOString());
  });

  it("tells pending (newer than the last applied) from skipped (older: never applied)", () => {
    const [a, , c] = files;
    const recorded = [a, c].flatMap((f) => (f ? [recordOf(f)] : []));
    expect(stateOf(migrationStates(files, recorded), "0001_b")).toEqual(["skipped"]);
    const onlyFirst = a ? [recordOf(a)] : [];
    const states = migrationStates(files, onlyFirst);
    expect(stateOf(states, "0001_b")).toEqual(["pending"]);
    expect(stateOf(states, "0002_c")).toEqual(["pending"]);
  });

  it("finds everything pending on an empty database", () => {
    const states = migrationStates(files, []);
    expect(states.map((s) => s.state)).toEqual(["pending", "pending", "pending"]);
  });

  it("flags a modified file, a migration applied twice and one unknown to the code", () => {
    const recorded = [
      ...files.map(recordOf),
      { hash: "edited", createdAtMs: 2000 }, // 0001 a second time, other content
      { hash: "hash-0000_a", createdAtMs: 2500 }, // 0000 applied again under another date
      { hash: "from-another-branch", createdAtMs: 4000 },
    ];
    const states = migrationStates(files, recorded);
    expect(stateOf(states, "0001_b")).toEqual(["duplicate"]);
    expect(stateOf(states, "0000_a")).toEqual(["duplicate", "applied"]);
    expect(stateOf(states, null)).toEqual(["unknown"]);

    const changed = migrationStates(files, [
      ...files.slice(0, 2).map(recordOf),
      { hash: "edited", createdAtMs: 3000 },
    ]);
    expect(stateOf(changed, "0002_c")).toEqual(["changed"]);
  });
});
