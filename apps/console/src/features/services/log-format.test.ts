import { describe, expect, it } from "vitest";
import { formatLogs } from "./log-format.ts";

const at = Date.parse("2026-11-11T18:42:07Z");
const line = (value: object) => JSON.stringify({ level: 30, time: at, ...value });

describe("formatLogs", () => {
  it("joins a request and its answer, and leaves the console's polling out", () => {
    const lines = [
      "> node --watch \u001b[33mWARN\u001b[0m src/server.ts",
      line({
        reqId: "req-1",
        req: { method: "POST", url: "/v1/flights" },
        msg: "incoming request",
      }),
      line({
        reqId: "req-1",
        res: { statusCode: 201 },
        responseTime: 6.2,
        msg: "request completed",
      }),
      line({ reqId: "req-2", req: { method: "GET", url: "/v1/health" }, msg: "incoming request" }),
      line({ reqId: "req-2", res: { statusCode: 200 }, responseTime: 1, msg: "request completed" }),
      line({ level: 40, msg: "Server listening" }),
    ];
    const out = formatLogs(lines);
    expect(out).toHaveLength(3);
    expect(out[0]).toBe("> node --watch WARN src/server.ts");
    expect(out[1]).toMatch(/^\d\d:\d\d:\d\d INFO POST \/v1\/flights 201 6 ms$/);
    expect(out[2]).toMatch(/WARN Server listening$/);
  });
});
