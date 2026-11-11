import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TRACKER_HEADERS } from "../../apps/api/src/testing/test-app.ts";
import { syntheticFlight } from "../../apps/api/src/testing/synthetic-flight.ts";
import { loggedInContext } from "../site/log-in.ts";
import { type J3Stack, startJ3Stack } from "./j3-stack.ts";

/** J3 alpha measures: the pilot checks the phases of a closed flight on its page. */
let stack: J3Stack;

beforeAll(async () => {
  stack = await startJ3Stack();
});
afterAll(() => stack?.stop());

/** A closed flight of the development pilot, sent as the tracker does. */
async function closedFlight(): Promise<string> {
  const flight = syntheticFlight();
  const id = flight.open.flightId;
  const post = (path: string, body: unknown) =>
    fetch(`${stack.apiUrl}/v1/flights${path}`, {
      method: "POST",
      headers: { ...TRACKER_HEADERS, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  await post("", flight.open);
  await post(`/${id}/close`, flight.close);
  return id;
}

describe("J3 phase check", () => {
  it("records the pilot's answer and shows it again on the next visit", async () => {
    const id = await closedFlight();
    const context = await loggedInContext(stack.browser, stack.siteUrl);
    const page = await context.newPage();
    await page.goto(`${stack.siteUrl}/fr/flights/${id}`);
    await page.getByLabel("Non, au moins une est fausse").check();
    await page.locator("textarea[name=note]").fill("Croisière détectée trop tôt");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.getByText("Merci, réponse enregistrée.").waitFor();

    await page.reload();
    expect(await page.getByLabel("Non, au moins une est fausse").isChecked()).toBe(true);
    expect(await page.locator("textarea[name=note]").inputValue()).toBe(
      "Croisière détectée trop tôt",
    );
    const review = await fetch(`${stack.apiUrl}/v1/flights/${id}/review`, {
      headers: TRACKER_HEADERS,
    });
    expect(await review.json()).toMatchObject({ phases: "wrong" });
    await context.close();
  });
});
