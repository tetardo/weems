import { LibrariesView } from "../../features/libraries/libraries-view.tsx";
import "../supervision.css";
import "./libraries.css";

export const metadata = { title: "Librairies · Weems Admin" };

/** Page Librairies (spec admin): versions of the libraries the repository uses, read-only. */
export default function LibrariesPage() {
  return <LibrariesView />;
}
