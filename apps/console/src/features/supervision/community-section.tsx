import type { SupervisionCommunity } from "@weems/contrats";
import type { ReactNode } from "react";
import { ago } from "../../format/time.ts";
import { HoursIcon, MostActiveIcon, NewPilotsIcon } from "../../ui/icons.ts";
import { hours, plural } from "./figures.ts";
import { Block } from "../../ui/block.tsx";

interface Row {
  id: string;
  name: string;
  publicHandle: string | null;
  detail: string;
}

/** Eight pilots, numbered; the name links to the public profile when there is one. */
function Ranking(props: {
  icon: ReactNode;
  title: string;
  hint: string;
  rows: Row[];
  siteUrl: string;
}) {
  return (
    <Block icon={props.icon} title={props.title} hint={props.hint}>
      {props.rows.length === 0 && <p className="muted">Aucun compte réel pour l&apos;instant.</p>}
      {props.rows.map((row, i) => (
        <div className="sv-rank" key={row.id}>
          <span className="mono muted">{i + 1}</span>
          {row.publicHandle ? (
            <a
              href={`${props.siteUrl}/fr/pilots/${row.publicHandle}`}
              target="_blank"
              rel="noreferrer"
            >
              {row.name}
            </a>
          ) : (
            <span>{row.name}</span>
          )}
          <span className="mono muted">{row.detail}</span>
        </div>
      ))}
    </Block>
  );
}

/** « Communauté »: real accounts only, the fictitious ones would take every place. */
export function CommunitySection(props: {
  community: SupervisionCommunity;
  siteUrl: string;
  nowMs: number;
}) {
  const { newest, mostActive, mostHours } = props.community;
  const activity = (pilot: { flights: number; hours: number }) =>
    `${plural(pilot.flights, "vol")} · ${hours(pilot.hours)}`;
  return (
    <section className="sv-section">
      <h2>Communauté</h2>
      <div className="sv-grid3">
        <Ranking
          icon={<NewPilotsIcon size={17} />}
          title="Nouveaux comptes"
          hint="8 derniers"
          siteUrl={props.siteUrl}
          rows={newest.map((pilot) => ({ ...pilot, detail: ago(pilot.createdAt, props.nowMs) }))}
        />
        <Ranking
          icon={<MostActiveIcon size={17} />}
          title="Plus actifs"
          hint="30 derniers jours"
          siteUrl={props.siteUrl}
          rows={mostActive.map((pilot) => ({ ...pilot, detail: activity(pilot) }))}
        />
        <Ranking
          icon={<HoursIcon size={17} />}
          title="Plus d'heures de vol"
          hint="en attendant les médailles"
          siteUrl={props.siteUrl}
          rows={mostHours.map((pilot) => ({ ...pilot, detail: activity(pilot) }))}
        />
      </div>
    </section>
  );
}
