import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Tokens } from "./tokens.ts";

/** Where the tokens are kept between two launches of the tracker. */
export interface TokenStore {
  load(): Tokens | null;
  save(tokens: Tokens): void;
  clear(): void;
}

/** Encryption by the system (Electron: safeStorage, i.e. DPAPI on Windows, Keychain on Mac). */
export interface Cipher {
  encrypt(text: string): Buffer;
  decrypt(data: Buffer): string;
}

/**
 * Tokens in one file, encrypted by the system: another Windows account cannot read them.
 * An unreadable file counts as logged out (the pilot logs in again, nothing else is lost).
 */
export function encryptedFileStore(path: string, cipher: Cipher): TokenStore {
  return {
    load() {
      if (!existsSync(path)) return null;
      try {
        return Tokens.parse(JSON.parse(cipher.decrypt(readFileSync(path))));
      } catch {
        return null;
      }
    },
    save(tokens) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, cipher.encrypt(JSON.stringify(tokens)), { mode: 0o600 });
    },
    clear() {
      rmSync(path, { force: true });
    },
  };
}

/** Tests, and tools that must not write anything. */
export function memoryStore(): TokenStore {
  let kept: Tokens | null = null;
  return {
    load: () => kept,
    save: (tokens) => {
      kept = tokens;
    },
    clear: () => {
      kept = null;
    },
  };
}
