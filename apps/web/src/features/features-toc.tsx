"use client";

import type { FeatureGroup } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "../i18n/navigation.ts";
import { CompareIcon } from "../ui/icons.ts";
import { GROUP_ICONS } from "./group-icons.ts";

/** The section in view: the last one whose top went above the middle of the screen. */
function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        const last = visible.at(-1);
        if (last) setActive(last.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/**
 * Summary of the page Fonctionnalités: one link per group with its count, sticky under the bar;
 * a strip that scrolls sideways on phones.
 */
export function FeaturesToc({ groups }: { groups: readonly [FeatureGroup, number][] }) {
  const t = useTranslations();
  const active = useActiveSection(groups.map(([group]) => group));
  const link =
    "flex items-center gap-2.5 rounded-inner px-2.5 py-2 text-sm whitespace-nowrap md:whitespace-normal";
  return (
    <nav
      aria-label={t("Features.toc")}
      className="flex gap-1 overflow-x-auto rounded-panel border border-line bg-surface p-1.5 md:sticky md:top-24 md:grid md:gap-0.5 md:p-2.5"
    >
      {groups.map(([group, count]) => {
        const Icon = GROUP_ICONS[group];
        const current = group === active;
        return (
          <a
            key={group}
            href={`#${group}`}
            aria-current={current ? "location" : undefined}
            className={`${link} ${current ? "bg-link/12 text-link" : "text-muted hover:text-ink"}`}
          >
            <Icon size={17} aria-hidden="true" />
            {t(`Plans.groups.${group}`)}
            <span className="ml-auto text-xs max-md:hidden">{count}</span>
          </a>
        );
      })}
      <hr className="mx-1 my-2 border-line max-md:hidden" />
      <Link href="/plans/compare" className={`${link} text-muted hover:text-ink max-md:hidden`}>
        <CompareIcon size={17} aria-hidden="true" />
        {t("Plans.compare.title")}
      </Link>
    </nav>
  );
}
