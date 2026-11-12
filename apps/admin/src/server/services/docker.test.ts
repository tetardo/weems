import { describe, expect, it } from "vitest";
import { parseComposePs } from "./docker.ts";

describe("parseComposePs", () => {
  it("reads one JSON object per line and keeps the known services", () => {
    const output = [
      { Service: "db", Name: "api-db-1", State: "running", Status: "Up 2 hours (healthy)" },
      { Service: "api", Name: "api-api-1", State: "exited", Status: "Exited (0) 5 minutes ago" },
      { Service: "other", Name: "x", State: "running" },
    ]
      .map((row) => JSON.stringify(row))
      .join("\n");
    expect(parseComposePs(output)).toEqual({
      db: { name: "api-db-1", running: true, status: "Up 2 hours (healthy)" },
      api: { name: "api-api-1", running: false, status: "Exited (0) 5 minutes ago" },
    });
  });

  it("reads the array of older versions, and nothing at all", () => {
    expect(parseComposePs('[{"Service":"db","State":"running"}]').db?.running).toBe(true);
    expect(parseComposePs("\n")).toEqual({});
  });
});
