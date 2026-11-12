import { type Browser, chromium } from "playwright";
import { startTestApp } from "../../apps/api/src/testing/test-app.ts";
import { freePort } from "../net/free-port.ts";
import { siteAddress, startSite } from "../site/site-server.ts";

export interface J3Stack {
  apiUrl: string;
  siteUrl: string;
  browser: Browser;
  stop: () => Promise<void>;
}

/** The real API (test database) and the built site on free ports, plus a browser (spec J3). */
export async function startJ3Stack(): Promise<J3Stack> {
  const sitePort = await freePort();
  const apiPort = await freePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const api = await startTestApp({ WEEMS_SITE_URL: siteAddress(sitePort), WEEMS_API_URL: apiUrl });
  await api.app.listen({ port: apiPort, host: "127.0.0.1" });
  const site = await startSite(sitePort, apiUrl);
  const executablePath = process.env["CHROMIUM_PATH"];
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  return {
    apiUrl,
    siteUrl: site.url,
    browser,
    stop: async () => {
      await browser.close();
      site.stop();
      await api.stop();
    },
  };
}
