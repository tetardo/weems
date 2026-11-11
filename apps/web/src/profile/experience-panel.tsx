import type { PilotStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CATEGORY_FILL } from "../aircraft/category-tone.ts";
import { formatDuration } from "../format/flight-format.ts";
import { CardBox } from "../ui/card-box.tsx";
import { AircraftIcon } from "../ui/icons.ts";
import { InfoTip } from "../ui/info-tip.tsx";
import { SectionTitle } from "../ui/section-title.tsx";
import { ExperienceRows } from "./experience-rows.tsx";

type Experience = PilotStats["experience"];

/** Share of each category in the airborne time, one coloured segment each. */
function StackedBar({ lines }: { lines: Experience["categories"] }) {
  const categories = useTranslations("Aircraft.categories");
  return (
    <div className="mt-0.5 mb-1.5 flex h-3 gap-0.5 overflow-hidden rounded-full">
      {lines.map((line) => (
        <i
          key={line.category}
          title={categories(line.category)}
          className={`block h-full ${CATEGORY_FILL[line.category]}`}
          style={{ flexGrow: line.airborneS, flexBasis: 0 }}
        />
      ))}
    </div>
  );
}

/** Single- and multi-engine time, as the two columns of an EASA logbook. */
function EngineTotals({ experience }: { experience: Experience }) {
  const t = useTranslations("Profile.experience");
  const help = useTranslations("Profile.help");
  const boxes = [
    { key: "singleEngine", total: experience.singleEngine },
    { key: "multiEngine", total: experience.multiEngine },
  ] as const;
  return (
    <div className="mt-3 mb-1 flex gap-2.5">
      {boxes.map(({ key, total }) => (
        <div key={key} className="relative flex-1 rounded-xl border border-line px-3 py-2">
          <span className="block text-xs text-muted">{t(key)}</span>
          <b className="font-title text-lg">{formatDuration(total.airborneS)}</b>
          <small className="ml-1 text-xs text-muted">
            {t("flights", { flights: total.flights })}
          </small>
          {key === "multiEngine" && <InfoTip text={help("engines")} label={help("label")} />}
        </div>
      ))}
    </div>
  );
}

/**
 * Block « Expérience par catégorie » of a public profile (spec J4, aircraft categories): airborne
 * time by aircraft category, single- and multi-engine time, categories not flown yet. Nothing
 * while no flight has a category (flights of trackers older than the catalogue).
 */
export function ExperiencePanel({ experience }: { experience: Experience }) {
  const t = useTranslations("Profile.experience");
  const help = useTranslations("Profile.help");
  if (experience.categories.length === 0) return null;
  const airborneS = experience.categories.reduce((sum, line) => sum + line.airborneS, 0);
  return (
    <section>
      <SectionTitle icon={AircraftIcon} title={t("title")}>
        <span className="text-sm text-muted">
          {t("note", { hours: formatDuration(airborneS) ?? "" })}
        </span>
      </SectionTitle>
      <CardBox className="relative">
        <InfoTip text={help("experience")} label={help("label")} />
        <div className="mb-1.5 pr-8 text-[12.5px] text-muted">{t("legend")}</div>
        <StackedBar lines={experience.categories} />
        <EngineTotals experience={experience} />
        <ExperienceRows lines={experience.categories} />
      </CardBox>
    </section>
  );
}
