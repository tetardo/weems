import type { ReactNode } from "react";
import { bytes } from "../../format/bytes.ts";
import { dayAndClock } from "../../format/time.ts";
import type { DatabaseView } from "../../server/database/database-page.ts";
import { BackupIcon, DiskIcon, MigrationsIcon, SimulatedIcon } from "../../ui/icons.ts";
import {
  backupWarning,
  growthText,
  migrationSummary,
  simulatedShare,
  sizeDetail,
} from "./model.ts";

function Tile(props: {
  icon: ReactNode;
  label: string;
  hint: ReactNode;
  value: string;
  tone: "ok" | "warn" | "bad";
  detail: ReactNode;
}) {
  const alert = props.tone !== "ok";
  return (
    <div className={`sv-tile ${alert ? `db-tile-${props.tone}` : ""}`}>
      <div className="sv-tile-head">
        <span className="sv-label">
          {props.icon}
          {props.label}
        </span>
        {props.hint}
      </div>
      <b className={`sv-big ${alert ? `db-${props.tone}` : ""}`}>{props.value}</b>
      <span className="sv-detail">{props.detail}</span>
    </div>
  );
}

function SizeTile({ view }: { view: DatabaseView }) {
  const { database, growth } = view;
  return (
    <Tile
      icon={<DiskIcon size={16} />}
      label="Taille totale"
      hint={growth && <span className="sv-up">{growthText(growth.totalBytes)} sur 7 j</span>}
      value={bytes(database.totalBytes)}
      tone="ok"
      detail={sizeDetail(database.tables, database.totalBytes)}
    />
  );
}

function BackupTile({ backups, nowMs }: { backups: DatabaseView["backups"]; nowMs: number }) {
  const [newest] = backups;
  const late = backupWarning(newest?.createdAt ?? null, nowMs);
  return (
    <Tile
      icon={<BackupIcon size={16} />}
      label="Dernière sauvegarde"
      hint={<span className={late ? "db-warn" : "db-ok"}>{late ? "à faire" : "ok"}</span>}
      value={newest ? dayAndClock(newest.createdAt) : "jamais"}
      tone={late ? "warn" : "ok"}
      detail={
        newest
          ? `${bytes(newest.bytes)} · ${backups.length} sur 7 gardées`
          : "rien ne sauvegarde la base pour l’instant"
      }
    />
  );
}

/** Size, migrations, last backup, simulated share. */
export function SummaryTiles({ view, nowMs }: { view: DatabaseView; nowMs: number }) {
  const migrations = migrationSummary(view.database.migrations);
  return (
    <div className="sv-tiles">
      <SizeTile view={view} />
      <Tile
        icon={<MigrationsIcon size={16} />}
        label="Migrations"
        hint={<span className={`db-${migrations.tone}`}>{migrations.status}</span>}
        value={`${migrations.applied} / ${migrations.inCode}`}
        tone={migrations.tone}
        detail="appliquées sur celles du code"
      />
      <BackupTile backups={view.backups} nowMs={nowMs} />
      <Tile
        icon={<SimulatedIcon size={16} />}
        label="Part simulée"
        hint={<span className="muted">tables des vols</span>}
        value={`${Math.round(simulatedShare(view.database.tables) * 100)} %`}
        tone="ok"
        detail="vols rejoués et comptes fictifs"
      />
    </div>
  );
}
