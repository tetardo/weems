import { randomInt } from "node:crypto";
import { CODE_ALPHABET, SINGLE_CODE_PATTERN } from "@weems/contrats";

const group = () =>
  Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

/** A new single-use code, WEEMS-XXXX-XXXX (about 8.5 × 10^11 possibilities). */
export function newSingleCode(): string {
  return `WEEMS-${group()}-${group()}`;
}

/**
 * The code as stored, whatever the pilot typed: capitals, no spaces; a single code typed
 * without its dashes (WEEMS7K4QM2XP) gets them back.
 */
export function canonicalCode(typed: string): string {
  const code = typed.toUpperCase().replace(/\s+/g, "");
  const bare = code.replaceAll("-", "");
  const single = /^WEEMS([A-Z0-9]{4})([A-Z0-9]{4})$/.exec(bare);
  return single ? `WEEMS-${single[1]}-${single[2]}` : code;
}

export const isSingleCode = (code: string) => SINGLE_CODE_PATTERN.test(code);
