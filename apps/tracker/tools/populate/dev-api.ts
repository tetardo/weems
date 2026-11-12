import {
  FictitiousPilotsCreated,
  FictitiousPopulation,
  type FictitiousPilot,
  type ProfileUpdate,
} from "@weems/contrats";
import type { Identity } from "./identities.ts";

/** Development routes of the API used by the populate tool (page Activité simulée). */
export interface DevApi {
  createPilots(pilots: { name: string; createdAtMs: number }[]): Promise<FictitiousPilot[]>;
  /** Sets the profile through the pilot's own route, as the site would. */
  saveProfile(pilotId: string, identity: Identity): Promise<void>;
  population(): Promise<FictitiousPopulation>;
  deleteAll(): Promise<FictitiousPopulation>;
  /** Bearer token flying as this fictitious account. */
  tokenOf(pilotId: string): string;
}

const PATH = "/v1/dev/fictitious-pilots";

function profileOf(identity: Identity): ProfileUpdate {
  return {
    handle: identity.handle,
    isPublic: identity.isPublic,
    country: identity.country,
    homeIcao: identity.homeIcao,
    level: identity.level,
    vatsimId: null,
    ivaoId: null,
    instagram: null,
    facebook: null,
    simbriefId: null,
  };
}

export function devApi(baseUrl: string, devToken: string): DevApi {
  async function call(method: string, path: string, token: string, body?: unknown) {
    const response = await fetch(new URL(path, baseUrl), {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
    }
    return response.json() as Promise<unknown>;
  }
  const tokenOf = (pilotId: string) => `${devToken}:${pilotId}`;
  return {
    tokenOf,
    async createPilots(pilots) {
      const body = {
        pilots: pilots.map((p) => ({
          name: p.name,
          createdAt: new Date(p.createdAtMs).toISOString(),
        })),
      };
      return FictitiousPilotsCreated.parse(await call("POST", PATH, devToken, body)).pilots;
    },
    async saveProfile(pilotId, identity) {
      await call("PUT", "/v1/me/profile", tokenOf(pilotId), profileOf(identity));
    },
    async population() {
      return FictitiousPopulation.parse(await call("GET", PATH, devToken));
    },
    async deleteAll() {
      return FictitiousPopulation.parse(await call("DELETE", PATH, devToken));
    },
  };
}
