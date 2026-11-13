import type { DatabaseTable } from "@weems/contrats";
import { bytes } from "../../format/bytes.ts";
import type { SizeGrowth } from "./history.ts";
import { growthText } from "./model.ts";

/** Real and simulated parts of a table, as wide as its size against the largest one. */
function ShareBar({ table, largest }: { table: DatabaseTable; largest: number }) {
  const width = largest ? Math.max(2, (table.totalBytes / largest) * 100) : 0;
  const simulated = table.simulatedShare ?? 0;
  return (
    <span className="db-bar" aria-hidden="true">
      <i style={{ width: `${width * (1 - simulated)}%` }} />
      <i className="sim" style={{ width: `${width * simulated}%` }} />
    </span>
  );
}

const fr = (n: number) => n.toLocaleString("fr-FR");

function TableLine(props: { table: DatabaseTable; largest: number; growth: SizeGrowth | null }) {
  const { table, growth } = props;
  const grew = growth?.tables[table.name];
  return (
    <tr>
      <td className="mono db-name">{table.name}</td>
      <td className="db-n db-wide">{table.rowsEstimate === null ? "—" : fr(table.rowsEstimate)}</td>
      <td className="db-n db-wide">{bytes(table.dataBytes)}</td>
      <td className="db-n db-wide">{bytes(table.indexBytes)}</td>
      <td className="db-n">
        <b>{bytes(table.totalBytes)}</b>
      </td>
      <td>
        <ShareBar table={table} largest={props.largest} />
      </td>
      <td className="db-n db-wide muted">
        {table.simulatedShare === null ? "—" : `${Math.round(table.simulatedShare * 100)} %`}
      </td>
      <td className="db-n db-wide muted">{grew === undefined ? "—" : growthText(grew)}</td>
    </tr>
  );
}

/** Every table of the application, largest first. */
export function TablesPanel(props: { tables: DatabaseTable[]; growth: SizeGrowth | null }) {
  const largest = props.tables[0]?.totalBytes ?? 0;
  return (
    <section className="sv-section">
      <div className="db-head">
        <h2>Tables</h2>
        <span className="sv-legend">
          <span>
            <i /> réel
          </span>
          <span>
            <i className="muted" /> simulé
          </span>
        </span>
      </div>
      <div className="panel db-scroll">
        <table>
          <thead>
            <tr>
              <th>Table</th>
              <th className="db-n db-wide">Lignes</th>
              <th className="db-n db-wide">Données</th>
              <th className="db-n db-wide">Index</th>
              <th className="db-n">Total</th>
              <th>Part</th>
              <th className="db-n db-wide">Simulé</th>
              <th className="db-n db-wide">7 j</th>
            </tr>
          </thead>
          <tbody>
            {props.tables.map((table) => (
              <TableLine key={table.name} table={table} largest={largest} growth={props.growth} />
            ))}
          </tbody>
        </table>
        <p className="db-hint muted">
          Lignes : estimation de PostgreSQL. Simulé : vols rejoués et comptes fictifs.
          {props.growth
            ? ` Évolution depuis le relevé du ${props.growth.since.split("-").reverse().join("/")}.`
            : " L’évolution apparaît dès demain : la console garde un relevé par jour."}
        </p>
      </div>
    </section>
  );
}
