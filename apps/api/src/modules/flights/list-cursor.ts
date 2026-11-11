import { ApiProblem } from "../../plugins/problem.ts";

/** Position in the list (newest first): the last flight of the previous page. */
export interface ListPosition {
  openedAt: string;
  flightId: string;
}

/** Opaque to clients: base64url of "openedAt|flightId". */
export function encodeCursor(position: ListPosition): string {
  return Buffer.from(`${position.openedAt}|${position.flightId}`).toString("base64url");
}

export function decodeCursor(cursor: string): ListPosition {
  const [openedAt, flightId] = Buffer.from(cursor, "base64url").toString().split("|");
  if (!openedAt || !flightId || Number.isNaN(Date.parse(openedAt))) {
    throw new ApiProblem(400, "Bad Request", "Invalid cursor.");
  }
  return { openedAt, flightId };
}
