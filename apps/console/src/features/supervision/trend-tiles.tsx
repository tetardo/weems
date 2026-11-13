import type { SupervisionTiles } from "@weems/contrats";
import type { ReactNode } from "react";
import {
  AccountsIcon,
  AirborneIcon,
  FlightsIcon,
  PublicProfilesIcon,
  WarningIcon,
} from "../../ui/icons.ts";
import { Bars } from "./bars.tsx";
import { plural, weekDelta } from "./figures.ts";

function Tile(props: {
  icon: ReactNode;
  label: string;
  value: number;
  /** New ones over 7 days; null for a figure of the moment (no trend). */
  week: number | null;
  daily: number[] | null;
  detail: ReactNode;
}) {
  const fr = props.value.toLocaleString("fr-FR");
  return (
    <div className="sv-tile">
      <div className="sv-tile-head">
        <span className="sv-label">
          {props.icon}
          {props.label}
        </span>
        <span className={props.week ? "sv-up" : "muted"}>
          {props.week === null ? "maintenant" : weekDelta(props.week)}
        </span>
      </div>
      <div className="sv-tile-body">
        <b>{fr}</b>
        {props.daily && <Bars values={props.daily} label={`${props.label} sur 7 jours`} />}
      </div>
      <span className="sv-detail">{props.detail}</span>
    </div>
  );
}

/** Real flights open for more than 24 h or closed without trajectory; nothing when none. */
function SuspiciousBand({ stale, withoutTrack }: SupervisionTiles["suspicious"]) {
  const total = stale + withoutTrack;
  if (total === 0) return null;
  return (
    <div className="sv-alert" role="status">
      <WarningIcon size={16} />
      <b>
        {total} vol{total > 1 ? "s" : ""} suspect{total > 1 ? "s" : ""}
      </b>
      <span>
        {stale} ouvert{stale > 1 ? "s" : ""} depuis plus de 24 h · {withoutTrack} clos sans
        trajectoire
      </span>
      <code>pnpm alpha-report</code>
    </div>
  );
}

/** First line of the page: four counters with their last 7 days, then the alert if any. */
export function TrendTiles({ tiles, liveUrl }: { tiles: SupervisionTiles; liveUrl: string }) {
  const { accounts, flights, live, profiles } = tiles;
  const share = profiles.realAccounts === 0 ? 0 : profiles.public / profiles.realAccounts;
  return (
    <>
      <div className="sv-tiles">
        <Tile
          icon={<AccountsIcon size={15} />}
          label="Comptes"
          value={accounts.real}
          week={accounts.newLast7Days}
          daily={accounts.daily}
          detail={`+ ${accounts.fictitious} fictifs · ${plural(accounts.pendingInvitations, "invitation")}`}
        />
        <Tile
          icon={<FlightsIcon size={15} />}
          label="Vols"
          value={flights.real}
          week={flights.newLast7Days}
          daily={flights.daily}
          detail={`${flights.today} aujourd'hui · + ${flights.simulated.toLocaleString("fr-FR")} simulés`}
        />
        <Tile
          icon={<AirborneIcon size={15} />}
          label="En l'air"
          value={live.flights}
          week={null}
          daily={null}
          detail={
            <>
              dont {live.simulated} simulé{live.simulated > 1 ? "s" : ""} ·{" "}
              <a href={liveUrl} target="_blank" rel="noreferrer">
                carte en direct
              </a>
            </>
          }
        />
        <Tile
          icon={<PublicProfilesIcon size={15} />}
          label="Profils publics"
          value={profiles.public}
          week={profiles.newLast7Days}
          daily={profiles.daily}
          detail={`${Math.round(share * 100)} % des comptes`}
        />
      </div>
      <SuspiciousBand {...tiles.suspicious} />
    </>
  );
}
