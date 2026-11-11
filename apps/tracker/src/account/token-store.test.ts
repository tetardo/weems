import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type Cipher, encryptedFileStore } from "./token-store.ts";

/** Stands for the system encryption (reversed base64, enough to prove nothing is in clear). */
const cipher: Cipher = {
  encrypt: (text) => Buffer.from(Buffer.from(text).toString("base64").split("").reverse().join("")),
  decrypt: (data) => Buffer.from(data.toString().split("").reverse().join(""), "base64").toString(),
};
const tokens = { accessToken: "access-1", refreshToken: "refresh-1", expiresAt: 1_000 };

let dir: string;
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("encrypted token file", () => {
  it("keeps the tokens encrypted between two launches", () => {
    dir = mkdtempSync(join(tmpdir(), "weems-tokens-"));
    const path = join(dir, "account", "tokens.bin");
    encryptedFileStore(path, cipher).save(tokens);
    expect(readFileSync(path).toString()).not.toContain("refresh-1");
    expect(encryptedFileStore(path, cipher).load()).toEqual(tokens);
  });

  it("treats an unreadable file as logged out, and clears it", () => {
    dir = mkdtempSync(join(tmpdir(), "weems-tokens-"));
    const path = join(dir, "tokens.bin");
    writeFileSync(path, "garbage");
    const store = encryptedFileStore(path, cipher);
    expect(store.load()).toBeNull();
    store.clear();
    expect(store.load()).toBeNull();
  });
});
