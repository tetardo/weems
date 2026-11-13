"use server";

import { revalidatePath } from "next/cache";
import { ApiRefused } from "../api/api-request.ts";
import { redeemCode } from "../api/offers-api.ts";
import { type RedeemState, refusalOf, typedCode } from "./redeem-outcome.ts";

/** Form action of the page /code: uses an offer code for the logged-in pilot. */
export async function redeemAction(_previous: RedeemState, form: FormData): Promise<RedeemState> {
  const code = typedCode(form.get("code"));
  if (code === "") return { status: "unknown" };
  try {
    const result = await redeemCode(code);
    // 404 comes back as null (unknown code).
    if (!result) return { status: "unknown" };
    revalidatePath("/[locale]/settings/plan", "page");
    return { status: "done", result };
  } catch (error) {
    if (error instanceof ApiRefused) return refusalOf(error.status);
    return { status: "error" };
  }
}
