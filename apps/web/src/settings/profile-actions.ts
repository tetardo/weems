"use server";

import { revalidatePath } from "next/cache";
import { ApiRefused } from "../api/api-request.ts";
import { deleteMyPhoto, saveMyProfile, setVisibility } from "../api/profile-api.ts";
import { type FieldError, readProfileForm } from "./profile-form-data.ts";

export type SaveState =
  | { status: "idle" | "saved" }
  | { status: "invalid"; field: FieldError }
  | { status: "taken" | "reserved" | "error" };

const refreshSettings = () => revalidatePath("/[locale]/settings/profile", "page");

/** What the API's refusal means for the form: 409 taken handle, 422 reserved or missing handle. */
function refusal(error: unknown): SaveState {
  if (!(error instanceof ApiRefused)) return { status: "error" };
  if (error.status === 409) return { status: "taken" };
  if (error.status === 422) return { status: "reserved" };
  return { status: "error" };
}

/** Form action of the settings page: the whole profile at once. */
export async function saveProfileAction(_previous: SaveState, form: FormData): Promise<SaveState> {
  const read = readProfileForm(form);
  if (!read.ok) return { status: "invalid", field: read.field };
  try {
    await saveMyProfile(read.update);
  } catch (error) {
    return refusal(error);
  }
  refreshSettings();
  return { status: "saved" };
}

export async function removePhotoAction(): Promise<void> {
  await deleteMyPhoto();
  refreshSettings();
}

/** Shows or hides one of the pilot's flights on their public profile. */
export async function setFlightHiddenAction(flightId: string, hidden: boolean): Promise<void> {
  await setVisibility(flightId, { hiddenOnProfile: hidden });
  refreshSettings();
  revalidatePath("/[locale]/logbook/flights/[flightId]/full", "page");
}
