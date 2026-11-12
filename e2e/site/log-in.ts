import { DEV_PILOT_LOGIN } from "@weems/contrats";
import type { Browser, BrowserContext, Page } from "playwright";

/** Development pilot, created by the API outside production (spec J3). */
export const DEV_PILOT: { email: string; password: string } = DEV_PILOT_LOGIN;

/** Fills the site's login form, as a pilot does. */
export async function fillLogin(page: Page, login = DEV_PILOT): Promise<void> {
  await page.locator("input[name=email]").fill(login.email);
  await page.locator("input[name=password]").fill(login.password);
  await page.locator("button[type=submit]").click();
}

/** A browser context logged in to the site as the development pilot. */
export async function loggedInContext(browser: Browser, siteUrl: string): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${siteUrl}/fr/login`);
  await fillLogin(page);
  await page.waitForURL("**/fr/logbook");
  await page.close();
  return context;
}
