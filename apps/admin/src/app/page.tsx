import { SupervisionView } from "../features/supervision/supervision-view.tsx";
import { config } from "../server/console.ts";
import "./supervision.css";

export const metadata = { title: "Supervision · Weems Admin" };

/** Home of the console: the page Supervision (spec admin). */
export default function SupervisionPage() {
  return <SupervisionView siteUrl={config().siteUrl} />;
}
