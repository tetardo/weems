import { describe, expect, it } from "vitest";
import { LogBuffer } from "./log-buffer.ts";

describe("LogBuffer", () => {
  it("joins chunks cut in the middle of a line", () => {
    const buffer = new LogBuffer();
    expect(buffer.write("first li")).toEqual([]);
    expect(buffer.write("ne\nsecond\r\nthi")).toEqual(["first line", "second"]);
    expect(buffer.all()).toEqual(["first line", "second", "thi"]);
  });

  it("keeps only the last lines", () => {
    const buffer = new LogBuffer(2);
    buffer.write("a\nb\nc\n");
    expect(buffer.all()).toEqual(["b", "c"]);
  });
});
