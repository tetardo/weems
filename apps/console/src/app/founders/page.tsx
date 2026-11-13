import { readFounders } from "../../actions/offers.ts";
import { FoundersView } from "../../features/founders/founders-view.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import "../offers.css";

export const metadata = { title: "Fondateurs · Weems Console" };
/** Read at each visit: places are won while the console is open. */
export const dynamic = "force-dynamic";

export default async function FoundersPage() {
  const result = await readFounders();
  if (!result.ok) {
    return <ErrorBox message={`Lecture impossible (${result.error}). L'API est-elle démarrée ?`} />;
  }
  return <FoundersView page={result.value} />;
}
