import type { LogbookStats } from "@weems/contrats";
import { ActivityTheme } from "./activity-theme.tsx";
import { FleetTheme } from "./fleet-theme.tsx";
import { LandingsTheme } from "./landings-theme.tsx";
import { StatsHeader } from "./stats-header.tsx";
import type { StatsTheme } from "./stats-themes.ts";
import { TechniqueTheme } from "./technique-theme.tsx";
import { ThemeNav } from "./theme-nav.tsx";

/**
 * Page Statistiques of the private logbook (spec carnet privé, § 5; maquette B v10): the period,
 * the sticky bar of themes, then Activité, Avions et routes, Atterrissages and Technique.
 */
export function StatsPage({ stats, today }: { stats: LogbookStats; today: Date }) {
  const locked = new Set<StatsTheme["id"]>(
    stats.phaseTime === null && stats.goodPractices === null ? ["technique"] : [],
  );
  return (
    <div className="grid gap-5">
      <StatsHeader stats={stats} />
      <ThemeNav locked={locked} />
      <ActivityTheme stats={stats} today={today} />
      <FleetTheme stats={stats} />
      <LandingsTheme stats={stats} />
      <TechniqueTheme stats={stats} />
    </div>
  );
}
