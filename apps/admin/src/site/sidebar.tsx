"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ServiceView } from "../server/services/service-view.ts";
import {
  AccountsIcon,
  DocsIcon,
  ExternalIcon,
  ServicesIcon,
  SiteIcon,
  TrafficIcon,
} from "../ui/icons.ts";
import { useConsoleStatus } from "./use-console-status.ts";

const NAMES = { db: "Base", api: "API", site: "Site" } as const;

function LocalState({ services }: { services: ServiceView[] }) {
  return (
    <div className="stat">
      <div className="t">État local</div>
      {services.map((service) => (
        <div className="r" key={service.id}>
          <i
            className={
              service.state === "running"
                ? "dot"
                : service.state === "error"
                  ? "dot warn"
                  : "dot off"
            }
          />
          {NAMES[service.id]}
          <span className="m">{service.state === "running" ? `:${service.port}` : "arrêté"}</span>
        </div>
      ))}
    </div>
  );
}

export function Sidebar({ apiUrl, siteUrl }: { apiUrl: string; siteUrl: string }) {
  const pathname = usePathname();
  const status = useConsoleStatus();
  const on = (href: string) => (pathname.startsWith(href) ? "on" : "");
  return (
    <aside className="side">
      <div className="top brand">
        Weems <span className="tag">Admin</span>
      </div>
      <nav className="grp">
        <div className="t">Exploitation</div>
        <Link href="/services" className={on("/services")}>
          <ServicesIcon /> Services <span className="c">{status.running} / 3</span>
        </Link>
        <Link href="/traffic" className={on("/traffic")}>
          <TrafficIcon /> Trafic simulé
          {status.trafficRunning && <span className="st live">en cours</span>}
        </Link>
      </nav>
      <nav className="grp">
        <div className="t">Utilisateurs</div>
        <Link href="/accounts" className={on("/accounts")}>
          <AccountsIcon /> Comptes
        </Link>
      </nav>
      <nav className="grp">
        <div className="t">Raccourcis</div>
        <a href={siteUrl} target="_blank" rel="noreferrer">
          <SiteIcon /> Site <ExternalIcon className="c" size={16} />
        </a>
        <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">
          <DocsIcon /> Documentation API <ExternalIcon className="c" size={16} />
        </a>
      </nav>
      <LocalState services={status.services} />
    </aside>
  );
}
