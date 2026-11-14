import { describe, expect, it } from "vitest";
import { keyTarget } from "./use-pinned-minute.ts";

const key = (k: string, shiftKey = false) => ({ key: k, shiftKey });

describe("keyTarget", () => {
  it("moves one minute, ten with Shift, within the flight", () => {
    expect(keyTarget(key("ArrowRight"), 5, 60)).toBe(6);
    expect(keyTarget(key("ArrowLeft", true), 25, 60)).toBe(15);
    expect(keyTarget(key("ArrowLeft", true), 4, 60)).toBe(0);
    expect(keyTarget(key("ArrowRight", true), 55, 60)).toBe(59);
  });

  it("jumps to the first and last minute, ignores other keys", () => {
    expect(keyTarget(key("Home"), 30, 60)).toBe(0);
    expect(keyTarget(key("End"), 30, 60)).toBe(59);
    expect(keyTarget(key("a"), 30, 60)).toBeNull();
  });
});
