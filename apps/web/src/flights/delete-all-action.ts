"use server";

import { revalidatePath } from "next/cache";
import { deleteAllFlights } from "../api/weems-api.ts";

/** Form action of the "delete all my flights" button (development only). */
export async function deleteAllAction(): Promise<void> {
  await deleteAllFlights();
  revalidatePath("/[locale]/flights", "page");
}
