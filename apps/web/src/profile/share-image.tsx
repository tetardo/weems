import type { PilotRoutes } from "@weems/contrats";
import { BRAND_PATH } from "../site/brand.tsx";
import { shareMap } from "./share-map.ts";

/** Size of the share image: the one Discord, Facebook and forums expect. */
export const SHARE_SIZE = { width: 1200, height: 630 };
const MAP = { width: 520, height: 280 };

/**
 * Colours of the dark theme (src/app/global.css, map-theme.ts): the image is drawn by the image
 * generator of Next.js, which knows neither CSS variables nor the visitor's theme.
 */
const COLORS = {
  bg: "#0e1320",
  glow: "#173352",
  line: "#26304a",
  ink: "#e8ecf5",
  muted: "#9aa6bf",
  accent: "#4fd1e8",
  onAccent: "#0e1320",
  airport: "#ffb454",
};

export interface ShareCard {
  name: string;
  /** Under the name: level, home airport. */
  subtitle: string;
  stats: { value: string; label: string }[];
  routes: PilotRoutes["routes"];
  /** Address of the profile, shown in full at the bottom. */
  address: string;
}

function RoutesSketch({ routes }: { routes: ShareCard["routes"] }) {
  const { lines, airports } = shareMap(routes, MAP.width, MAP.height);
  return (
    <svg
      width={MAP.width}
      height={MAP.height}
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      style={{ position: "absolute", right: 40, bottom: 40 }}
    >
      {lines.map((line, i) => (
        <path
          key={i}
          d={line.d}
          fill="none"
          stroke={COLORS.accent}
          strokeOpacity={0.85}
          strokeWidth={line.width}
          strokeLinecap="round"
        />
      ))}
      {airports.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} fill={COLORS.airport} />
      ))}
    </svg>
  );
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 700 }}>
      <svg width={40} height={40} viewBox="0 0 24 24">
        <path
          d={BRAND_PATH}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Weems
    </div>
  );
}

/** Initials (the generator cannot read the WebP photos), name, level and home airport. */
function Who({ card }: { card: ShareCard }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 56 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 150,
          height: 150,
          borderRadius: 75,
          border: `4px solid ${COLORS.line}`,
          backgroundColor: COLORS.accent,
          color: COLORS.onAccent,
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        {card.name.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: card.name.length > 14 ? 56 : 76, fontWeight: 700, maxWidth: 820 }}>
          {card.name}
        </div>
        <div style={{ fontSize: 28, color: COLORS.muted, marginTop: 6 }}>{card.subtitle}</div>
      </div>
    </div>
  );
}

function Stats({ stats }: { stats: ShareCard["stats"] }) {
  return (
    <div style={{ display: "flex", gap: 56, marginTop: 64 }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{ display: "flex", flexDirection: "column", fontSize: 24, color: COLORS.muted }}
        >
          <span style={{ fontSize: 56, fontWeight: 700, color: COLORS.ink }}>{stat.value}</span>
          {stat.label}
        </div>
      ))}
    </div>
  );
}

/**
 * Share image of a public profile (spec J4 référencement, mock-up j4-maquette-partage.png):
 * brand, pilot, three statistics, sketch of the routes, address. The medals block comes with the
 * medals.
 */
export function ShareImage({ card }: { card: ShareCard }) {
  const background = `radial-gradient(circle at 85% 20%, ${COLORS.glow} 0, ${COLORS.bg} 60%)`;
  return (
    <div
      style={{
        ...SHARE_SIZE,
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        position: "relative",
        color: COLORS.ink,
        backgroundColor: COLORS.bg,
        backgroundImage: background,
      }}
    >
      <Brand />
      <Who card={card} />
      <Stats stats={card.stats} />
      <RoutesSketch routes={card.routes} />
      <div
        style={{ position: "absolute", left: 64, bottom: 40, fontSize: 22, color: COLORS.accent }}
      >
        {card.address}
      </div>
    </div>
  );
}
