import type { SupervisionActivity, SupervisionEventKind } from "@weems/contrats";
import { ago } from "../../format/time.ts";
import { AlphaIcon, ChartIcon, EventsIcon } from "../../ui/icons.ts";
import { StackedBars } from "./bars.tsx";
import { eventText } from "./figures.ts";
import { Block } from "../../ui/block.tsx";

const DOT: Record<SupervisionEventKind, string> = {
  accountCreated: "info",
  accountDisabled: "off",
  invitationCreated: "off",
  profilePublished: "ok",
  flightOpened: "info",
  flightClosed: "ok",
};

const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

function FlightsChart({ days }: { days: SupervisionActivity["days"] }) {
  return (
    <Block icon={<ChartIcon size={17} />} title="Vols sur 14 jours">
      <div className="sv-legend">
        <span>
          <i /> Réels
        </span>
        <span>
          <i className="muted" /> Simulés
        </span>
      </div>
      <StackedBars
        bottom={days.map((day) => day.real)}
        top={days.map((day) => day.simulated)}
        titles={days.map(
          (day) => `${dayMonth(day.date)} : ${day.real} réels, ${day.simulated} simulés`,
        )}
        label="Vols réels et simulés par jour, sur 14 jours"
      />
      <div className="sv-axis">
        <span>{days[0] && dayMonth(days[0].date)}</span>
        <span>{days[7] && dayMonth(days[7].date)}</span>
        <span>aujourd&apos;hui</span>
      </div>
    </Block>
  );
}

function AlphaGauge(props: { label: string; value: string; percent: number; done: boolean }) {
  return (
    <div className="sv-share wide">
      <span>{props.label}</span>
      <span className="sv-gauge">
        <i
          className={props.done ? "ok" : ""}
          style={{ width: `${Math.min(100, props.percent)}%` }}
        />
      </span>
      <span className="mono">{props.value}</span>
    </div>
  );
}

function AlphaBlock({ alpha }: { alpha: SupervisionActivity["alpha"] }) {
  const { targets } = alpha;
  const share = alpha.correctShare;
  return (
    <Block icon={<AlphaIcon size={17} />} title="Critère de sortie de l'alpha (J3)">
      <AlphaGauge
        label="Pilotes"
        value={`${alpha.pilots} / ${targets.pilots}`}
        percent={(alpha.pilots / targets.pilots) * 100}
        done={alpha.pilots >= targets.pilots}
      />
      <AlphaGauge
        label="Vols clos"
        value={`${alpha.closedFlights} / ${targets.flights}`}
        percent={(alpha.closedFlights / targets.flights) * 100}
        done={alpha.closedFlights >= targets.flights}
      />
      <AlphaGauge
        label="Phases justes"
        value={share === null ? "—" : `${Math.round(share * 100)} %`}
        percent={share === null ? 0 : (share / targets.correctShare) * 100}
        done={share !== null && share >= targets.correctShare}
      />
      <span className="muted sv-note">Comptes réels et vols réels seulement.</span>
    </Block>
  );
}

function EventsBlock({ events, nowMs }: { events: SupervisionActivity["events"]; nowMs: number }) {
  return (
    <Block icon={<EventsIcon size={17} />} title="Derniers événements" className="sv-events">
      {events.length === 0 && <p className="muted">Rien encore : aucune activité réelle.</p>}
      {events.map((event, i) => (
        <div className="sv-event" key={`${event.at}-${i}`}>
          <span className="mono muted">{ago(event.at, nowMs)}</span>
          <i className={`sv-dot ${DOT[event.kind]}`} />
          <span>{eventText(event)}</span>
        </div>
      ))}
    </Block>
  );
}

/** « Activité »: the last 14 days, the alpha criterion and the latest real events. */
export function ActivitySection({
  activity,
  nowMs,
}: {
  activity: SupervisionActivity;
  nowMs: number;
}) {
  return (
    <section className="sv-section">
      <h2>Activité</h2>
      <div className="sv-split">
        <div className="sv-stack">
          <FlightsChart days={activity.days} />
          <AlphaBlock alpha={activity.alpha} />
        </div>
        <EventsBlock events={activity.events} nowMs={nowMs} />
      </div>
    </section>
  );
}
