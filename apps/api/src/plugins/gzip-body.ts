import { createGunzip } from "node:zlib";
import type { FastifyInstance } from "fastify";
import { ApiProblem } from "./problem.ts";

/** Fastify compares the Content-Length with this count, not with the decompressed bytes. */
type CountedStream = NodeJS.ReadableStream & { receivedEncodedLength?: number };

/**
 * Request bodies sent with `Content-Encoding: gzip` (the tracker compresses its trajectories,
 * fiche 021) are decompressed before parsing. Each route's body limit applies to the
 * decompressed size, which also stops oversized archives. Other encodings: 415.
 */
export function registerGzipBodies(app: FastifyInstance): void {
  app.addHook("preParsing", async (request, _reply, payload) => {
    const encoding = request.headers["content-encoding"]?.toLowerCase();
    if (encoding === undefined || encoding === "identity") return payload;
    if (encoding !== "gzip") {
      throw new ApiProblem(
        415,
        "Unsupported Media Type",
        `Content-Encoding ${encoding} is not accepted.`,
      );
    }
    const gunzip: CountedStream = createGunzip();
    gunzip.receivedEncodedLength = 0;
    payload.on("data", (chunk: Buffer) => {
      gunzip.receivedEncodedLength = (gunzip.receivedEncodedLength ?? 0) + chunk.length;
    });
    // A broken archive is the client's fault: 400, not 500.
    gunzip.once("error", (error) => Object.assign(error, { statusCode: 400 }));
    return payload.pipe(gunzip as NodeJS.WritableStream & CountedStream);
  });
}
