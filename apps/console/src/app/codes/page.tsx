import { readCodes } from "../../actions/offers.ts";
import { CodesView } from "../../features/codes/codes-view.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import "../offers.css";

export const metadata = { title: "Codes d'offre · Weems Console" };
/** Read at each visit: codes are used while the console is open. */
export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const result = await readCodes();
  if (!result.ok) {
    return <ErrorBox message={`Lecture impossible (${result.error}). L'API est-elle démarrée ?`} />;
  }
  return <CodesView page={result.value} />;
}
