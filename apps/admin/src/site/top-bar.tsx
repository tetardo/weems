"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AccountsIcon,
  ActivityIcon,
  ServicesIcon,
  SupervisionIcon,
  TerminalIcon,
  TrafficIcon,
} from "../ui/icons.ts";
const TITLES = {
  "/services": "Services",
  "/traffic": "Trafic simulé",
  "/activity": "Activité simulée",
  "/accounts": "Comptes",
  "/customize": "Personnalisation",
  "/libraries": "Librairies",
};
const titleOf = (pathname: string) =>
  pathname === "/"
    ? "Supervision"
    : (Object.entries(TITLES).find(([href]) => pathname.startsWith(href))?.[1] ?? "Admin");

export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <span className="mlogo brand">
        Weems <span className="tag">Admin</span>
      </span>
      <span className="crumb">
        Admin / <b>{titleOf(pathname)}</b>
      </span>
      <span className="sp localbadge hide">
        <TerminalIcon size={14} /> localhost · Mac
      </span>
    </header>
  );
}

/** Bottom tab bar under 640 px. */
export function MobileTabs() {
  const pathname = usePathname();
  const on = (href: string) =>
    (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "on" : "";
  return (
    <nav className="mtabs">
      <Link href="/" className={on("/")}>
        <SupervisionIcon size={22} /> Supervision
      </Link>
      <Link href="/services" className={on("/services")}>
        <ServicesIcon size={22} /> Services
      </Link>
      <Link href="/traffic" className={on("/traffic")}>
        <TrafficIcon size={22} /> Trafic
      </Link>
      <Link href="/activity" className={on("/activity")}>
        <ActivityIcon size={22} /> Activité
      </Link>
      <Link href="/accounts" className={on("/accounts")}>
        <AccountsIcon size={22} /> Comptes
      </Link>
    </nav>
  );
}
