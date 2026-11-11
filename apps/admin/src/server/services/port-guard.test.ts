import { describe, expect, it } from "vitest";
import { busyPortMessage } from "./port-guard.ts";

describe("busyPortMessage", () => {
  it("names the Docker container holding the port and how to stop it", () => {
    expect(busyPortMessage(3000, "weems-api-1")).toContain("docker stop weems-api-1");
  });

  it("points to lsof when no container publishes the port", () => {
    expect(busyPortMessage(3001, null)).toContain("lsof -i :3001");
  });
});
