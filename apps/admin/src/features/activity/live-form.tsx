"use client";

import { Field, Segmented } from "@weems/ui";
import { useState } from "react";
import type { ActivityLaunch } from "../../server/activity/launch.ts";
import { TakeoffIcon, TrafficIcon, VisitorsIcon } from "../../ui/icons.ts";
import { NumberField } from "../../ui/number-field.tsx";
import { Foot, type FormProps, Header } from "./form-parts.tsx";

type Live = Extract<ActivityLaunch, { kind: "live" }>;
type Change = <K extends keyof Live>(key: K, value: Live[K]) => void;

const SPEEDS = [1, 10, 50] as const;
const SPEED_OPTIONS = SPEEDS.map((s) => ({ value: String(s), label: `×${s}` }));

function LiveFields({ live, set }: { live: Live; set: Change }) {
  return (
    <div className="fields two">
      <NumberField
        label="Vols en direct"
        value={live.flights}
        min={1}
        max={200}
        unit="en même temps"
        onChange={(n) => set("flights", n)}
      />
      <NumberField
        label="Visiteurs sur la carte"
        value={live.visitors}
        min={0}
        max={5000}
        unit="visiteurs"
        onChange={(n) => set("visitors", n)}
      />
      <NumberField
        label="Durée"
        value={live.minutes}
        min={1}
        max={240}
        unit="min"
        onChange={(n) => set("minutes", n)}
      />
      <Field label="Vitesse">
        <Segmented
          name="live-speed"
          label="Vitesse"
          options={SPEED_OPTIONS}
          value={String(live.speed)}
          onChange={(value) => set("speed", Number(value) as Live["speed"])}
        />
      </Field>
    </div>
  );
}

function LiveSummary({ live }: { live: Live }) {
  return (
    <div className="sum">
      <div className="r">
        <TakeoffIcon size={16} />
        <span>
          Les {live.flights} premiers départs dans la première minute, puis une relève à chaque
          atterrissage
        </span>
      </div>
      <div className="r">
        <VisitorsIcon size={16} />
        <span>
          {live.visitors} visiteurs connectés au direct, invisibles sur le site : ils chargent
          l&apos;API
        </span>
      </div>
    </div>
  );
}

/** Block 2, « temporaire »: fictitious accounts flying now, and visitors (pnpm populate live). */
export function LiveForm(props: FormProps) {
  const [live, setLive] = useState<Live>({
    kind: "live",
    flights: 12,
    visitors: 100,
    minutes: 30,
    speed: 1,
  });
  const set: Change = (key, value) => setLive((before) => ({ ...before, [key]: value }));
  return (
    <section className="panel mode">
      <Header icon={<TrafficIcon size={20} />} step="2 · TEMPORAIRE" title="Activité en direct" />
      <p className="lead">
        Des comptes fictifs décollent maintenant, des visiteurs regardent la carte. S&apos;arrête
        seul à la fin de la durée.
      </p>
      <LiveFields live={live} set={set} />
      <LiveSummary live={live} />
      <Foot
        note={props.note}
        disabled={props.disabled}
        label="Lancer le direct"
        onClick={() => props.onLaunch(live)}
      />
    </section>
  );
}
