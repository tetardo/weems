import { readCustomization } from "../../actions/customize.ts";
import { CustomizeView } from "../../features/customize/customize-view.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import "./customize.css";

export const metadata = { title: "Personnalisation · Weems Console" };
/** Read at each visit: the images change from this page. */
export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const result = await readCustomization();
  if (!result.ok) {
    return (
      <ErrorBox message={`L'API ne répond pas (${result.error}). Démarrez-la dans Services.`} />
    );
  }
  return <CustomizeView initial={result.value} />;
}
