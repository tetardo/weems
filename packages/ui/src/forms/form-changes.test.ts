import { describe, expect, it } from "vitest";
import { countChanges, snapshotOf } from "./form-changes.ts";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return snapshotOf(data);
};

describe("countChanges", () => {
  it("counts nothing for the same values", () => {
    expect(countChanges(form({ a: "1", b: "" }), form({ a: "1", b: "" }))).toBe(0);
  });

  it("counts each field whose value changed", () => {
    expect(countChanges(form({ a: "1", b: "x", c: "" }), form({ a: "2", b: "y", c: "" }))).toBe(2);
  });

  it("counts a box ticked or unticked since", () => {
    expect(countChanges(form({ a: "1" }), form({ a: "1", consent: "on" }))).toBe(1);
    expect(countChanges(form({ a: "1", consent: "on" }), form({ a: "1" }))).toBe(1);
  });

  it("ignores a chosen file", () => {
    const data = new FormData();
    data.append("photo", new Blob(["x"]), "photo.png");
    expect(snapshotOf(data).size).toBe(0);
  });
});
