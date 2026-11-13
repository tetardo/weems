import { SupervisionView } from "../features/supervision/supervision-view.tsx";
import { config } from "../server/console.ts";
import "./supervision.css";

export const metadata = { title: "Supervision · Weems Console" };

/** Home of the console: the page Supervision (console spec). */
export default function SupervisionPage() {
  return <SupervisionView siteUrl={config().siteUrl} />;
}
