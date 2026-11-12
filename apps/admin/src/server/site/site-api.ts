import { type HomeImageSettings, HomeImages, type HomeTheme } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";
import { problemOf } from "../accounts/admin-api.ts";

/** Uploads take longer than the other calls: a 15 MB image, then its resizing by the API. */
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * Home page images through the API (spec J4 personnalisation): read on the public route, changed
 * on /v1/admin/site/* as the administrator logged in (their session cookie).
 */
export class SiteApi {
  private readonly config: ConsoleConfig;
  private readonly cookie: string;

  constructor(config: ConsoleConfig, cookie: string) {
    this.config = config;
    this.cookie = cookie;
  }

  private async send(path: string, init: RequestInit, timeout = 5_000): Promise<Response> {
    const response = await fetch(new URL(path, this.config.apiUrl), {
      ...init,
      headers: { cookie: this.cookie, ...init.headers },
      signal: AbortSignal.timeout(timeout),
      cache: "no-store",
    });
    if (!response.ok) throw await problemOf(response);
    return response;
  }

  private path(theme: HomeTheme, settings?: HomeImageSettings): string {
    const query = settings ? `?${new URLSearchParams({ ...settings }).toString()}` : "";
    return `/v1/admin/site/home-images/${theme}${query}`;
  }

  async homeImages(): Promise<HomeImages> {
    const response = await this.send("/v1/site/home-images", {});
    return HomeImages.parse(await response.json());
  }

  /** The stored WebP of a theme, to give it to the other theme (« même image »). */
  async imageOf(path: string): Promise<Blob> {
    return (await this.send(path, {})).blob();
  }

  async upload(theme: HomeTheme, image: Blob, settings: HomeImageSettings): Promise<void> {
    const init = { method: "PUT", body: image, headers: { "content-type": image.type } };
    await this.send(this.path(theme, settings), init, UPLOAD_TIMEOUT_MS);
  }

  async update(theme: HomeTheme, settings: HomeImageSettings): Promise<void> {
    await this.send(this.path(theme), {
      method: "PATCH",
      body: JSON.stringify(settings),
      headers: { "content-type": "application/json" },
    });
  }

  async reset(theme: HomeTheme): Promise<void> {
    await this.send(this.path(theme), { method: "DELETE" });
  }
}
