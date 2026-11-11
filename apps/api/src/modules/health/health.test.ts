import { describe, expect, it } from "vitest";
import { buildApp } from "../../app.ts";
import { loadConfig } from "../../config.ts";
import { connectTestDatabase } from "../../testing/database.ts";

describe("GET /v1/health", () => {
  it("is ok when the database answers", async () => {
    const database = connectTestDatabase();
    const app = await buildApp({ config: loadConfig({}), database, logger: false });
    const answer = await app.inject({ method: "GET", url: "/v1/health" });
    expect(answer.json()).toEqual({ status: "ok", database: "ok" });
    await app.close();
    await database.close();
  });

  it("answers 503 when the database is unreachable", async () => {
    const database = { ...connectTestDatabase(), ping: () => Promise.reject(new Error("down")) };
    const app = await buildApp({ config: loadConfig({}), database, logger: false });
    const answer = await app.inject({ method: "GET", url: "/v1/health" });
    expect(answer.statusCode).toBe(503);
    await app.close();
    await database.close();
  });
});
