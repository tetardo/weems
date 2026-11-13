"use client";

import { Segmented } from "@weems/ui";
import { useState } from "react";
import { shortDate } from "../../format/time.ts";
import type { LibraryRow } from "../../server/libraries/report.ts";
import { ExternalIcon } from "../../ui/icons.ts";
import {
  type FilterId,
  type Grouping,
  type RowGroup,
  filterOptions,
  filterRows,
  gapLabel,
  groupRows,
} from "./table-model.ts";

const GROUPINGS = [
  { value: "library", label: "Par librairie" },
  { value: "user", label: "Par application" },
] as const;

function TableHead() {
  return (
    <thead>
      <tr>
        <th>Librairie</th>
        <th>Utilisée par</th>
        <th>Installée</th>
        <th>Dernière</th>
        <th>Écart</th>
        <th>Sortie le</th>
        <th>Lien</th>
      </tr>
    </thead>
  );
}

/** Rows of one group, under its title in the « par application » view. */
function GroupBody({ group }: { group: RowGroup }) {
  return (
    <tbody>
      {group.title && (
        <tr className="lib-group">
          <th colSpan={7} scope="rowgroup">
            <span className="mono">{group.title}</span>
            <span className="muted"> · {group.summary}</span>
          </th>
        </tr>
      )}
      {group.rows.map((row) => (
        <LibraryLine key={row.name} row={row} />
      ))}
    </tbody>
  );
}

function LibraryLine({ row }: { row: LibraryRow }) {
  return (
    <tr className="lib-row">
      <td className="c-name">
        <span className="mono lib-name">{row.name}</span>
        {row.dev && <span className="lib-tag">dev</span>}
        {row.alerts > 0 && <span className="lib-sev high">sécurité</span>}
      </td>
      <td className="c-users">
        <span className="lib-users">
          {row.users.map((user) => (
            <span key={user} className="lib-user mono">
              {user}
            </span>
          ))}
        </span>
      </td>
      <td className="c-installed mono muted">
        {row.installed}
        {row.versions.length > 1 && (
          <span className="lib-tag warn" title={row.versions.join(", ")}>
            {row.versions.length} versions
          </span>
        )}
      </td>
      <td className="c-latest mono">
        <span className="lib-arrow">→ </span>
        {row.latest ?? "—"}
      </td>
      <td className="c-gap">
        <span className={`lib-gap ${row.gap}`}>{gapLabel(row)}</span>
        {row.held && <span className="lib-tag held">retenue : {row.held}</span>}
      </td>
      <td className="c-date muted">{row.releasedAt ? shortDate(row.releasedAt) : "—"}</td>
      <td className="c-link">
        <a
          className="lib-link"
          href={row.homepage}
          target="_blank"
          rel="noreferrer"
          aria-label={`Page officielle de ${row.name}`}
          title="Page officielle"
        >
          <ExternalIcon size={16} />
        </a>
      </td>
    </tr>
  );
}

/** The libraries, filtered by gap and grouped by library or by package of the repository. */
export function LibrariesTable({ rows }: { rows: LibraryRow[] }) {
  const [filter, setFilter] = useState<FilterId>("updates");
  const [grouping, setGrouping] = useState<Grouping>("library");
  const shown = filterRows(rows, filter);
  const groups = groupRows(rows, shown, grouping);
  return (
    <section className="panel lib-table" aria-label="Liste des librairies">
      <div className="lib-toolbar">
        <Segmented
          name="libraries-filter"
          label="Filtre"
          options={filterOptions(rows)}
          value={filter}
          onChange={(value) => setFilter(value as FilterId)}
        />
        <Segmented
          name="libraries-grouping"
          label="Regroupement"
          options={GROUPINGS}
          value={grouping}
          onChange={(value) => setGrouping(value as Grouping)}
        />
      </div>
      <div className="lib-scroll">
        <table>
          <TableHead />
          {groups.map((group) => (
            <GroupBody key={group.key} group={group} />
          ))}
        </table>
        {shown.length === 0 && <p className="lib-empty muted">Aucune librairie dans ce filtre.</p>}
      </div>
    </section>
  );
}
