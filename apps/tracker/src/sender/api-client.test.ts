import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { httpApiClient } from "./api-client.ts";

let received: { headers: IncomingHttpHeaders; body: Buffer }[] = [];
const server = createServer((request, response) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk: Buffer) => chunks.push(chunk));
  request.on("end", () => {
    received.push({ headers: request.headers, body: Buffer.concat(chunks) });
    response.statusCode = 201;
    response.end();
  });
});
let client: ReturnType<typeof httpApiClient>;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  client = httpApiClient({
    baseUrl: `http://127.0.0.1:${port}`,
    token: "dev-token",
    trackerVersion: "0.1.0",
  });
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("HTTP client of the API", () => {
  it("sends small bodies as plain JSON", async () => {
    received = [];
    expect(await client.post("/v1/flights", { a: 1 })).toEqual({ status: 201 });
    expect(received[0]?.headers["content-encoding"]).toBeUndefined();
    expect(JSON.parse(received[0]?.body.toString() ?? "")).toEqual({ a: 1 });
  });

  it("compresses large bodies such as a trajectory (fiche 021)", async () => {
    received = [];
    const points = Array.from({ length: 2_000 }, (_, i) => ({ i, altMsl: 35_000.123456 }));
    await client.post("/v1/flights/x/track", { points });
    const [request] = received;
    expect(request?.headers["content-encoding"]).toBe("gzip");
    expect(JSON.parse(gunzipSync(request?.body ?? Buffer.alloc(0)).toString())).toEqual({
      points,
    });
  });
});
