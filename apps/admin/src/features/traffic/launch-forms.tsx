"use client";

import { useState } from "react";
import type { Launch } from "../../server/traffic/launch.ts";
import { LoadIcon, SimulateIcon, StartIcon } from "../../ui/icons.ts";
import { NumberField } from "./number-field.tsx";

const SPEEDS = [1, 10, 50, 100];

interface FormProps {
  disabled: boolean;
  onLaunch: (launch: Launch) => void;
}

function ModeHeader({
  icon,
  title,
  command,
}: {
  icon: React.ReactNode;
  title: string;
  command: string;
}) {
  return (
    <div className="hd">
      <div className="ic">{icon}</div>
      <div>
        <h3>{title}</h3>
        <div className="cmd">{command}</div>
      </div>
    </div>
  );
}

function SpeedChoice({ speed, onSpeed }: { speed: number; onSpeed: (speed: number) => void }) {
  return (
    <div className="f">
      <label>Vitesse</label>
      <div className="segs">
        {SPEEDS.map((value) => (
          <button
            key={value}
            className={speed === value ? "on" : ""}
            onClick={() => onSpeed(value)}
          >
            ×{value}
          </button>
        ))}
      </div>
    </div>
  );
}

function SimulateForm({ disabled, onLaunch }: FormProps) {
  const [count, setCount] = useState(10);
  const [stagger, setStagger] = useState(30);
  const [speed, setSpeed] = useState(10);
  return (
    <section className="panel mode">
      <ModeHeader
        icon={<SimulateIcon size={20} />}
        title="Pilotes simulés"
        command="pnpm simulate"
      />
      <div className="fields">
        <NumberField
          label="Pilotes"
          value={count}
          min={1}
          max={50}
          unit="1 à 50"
          onChange={setCount}
        />
        <NumberField
          label="Décalage"
          value={stagger}
          min={0}
          max={600}
          unit="s"
          onChange={setStagger}
        />
      </div>
      <SpeedChoice speed={speed} onSpeed={setSpeed} />
      <div className="foot">
        <span className="note">
          {disabled ? "Un lancement est déjà en cours." : "Vols du pilote de développement."}
        </span>
        <button
          className="btn"
          disabled={disabled}
          onClick={() => onLaunch({ kind: "simulate", count, speed, stagger })}
        >
          <StartIcon size={16} /> Lancer
        </button>
      </div>
    </section>
  );
}

function LoadForm({ disabled, onLaunch }: FormProps) {
  const [pilots, setPilots] = useState(50);
  const [viewers, setViewers] = useState(100);
  const [minutes, setMinutes] = useState(30);
  const [speed, setSpeed] = useState(1);
  return (
    <section className="panel mode">
      <ModeHeader icon={<LoadIcon size={20} />} title="Test de charge" command="pnpm load" />
      <div className="fields four">
        <NumberField label="Pilotes" value={pilots} min={1} max={2000} onChange={setPilots} />
        <NumberField label="Spectateurs" value={viewers} min={0} max={5000} onChange={setViewers} />
        <NumberField
          label="Durée"
          value={minutes}
          min={1}
          max={120}
          unit="min"
          onChange={setMinutes}
        />
        <NumberField label="Vitesse" value={speed} min={1} max={100} unit="×" onChange={setSpeed} />
      </div>
      <div className="foot">
        <span className="note">Vide d&apos;abord les vols simulés (jamais les vols MSFS).</span>
        <button
          className="btn ghost"
          disabled={disabled}
          onClick={() => onLaunch({ kind: "load", pilots, viewers, minutes, speed })}
        >
          <StartIcon size={16} /> Lancer
        </button>
      </div>
    </section>
  );
}

export function LaunchForms(props: FormProps) {
  return (
    <div className="modes">
      <SimulateForm {...props} />
      <LoadForm {...props} />
    </div>
  );
}
