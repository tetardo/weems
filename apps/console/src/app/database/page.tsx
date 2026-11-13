import { DatabaseView } from "../../features/database/database-view.tsx";
import "../supervision.css";
import "./database.css";

export const metadata = { title: "Base de données · Weems Console" };

/** Page Base de données (console spec): sizes, migrations, backups and cleanup. */
export default function DatabasePage() {
  return <DatabaseView />;
}
