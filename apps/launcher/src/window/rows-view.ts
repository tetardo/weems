import type { LauncherCommand, Row, RowId, RowState } from "../launcher-state.ts";
import { sinceText } from "./format.ts";
import { ICONS } from "./icons.ts";

const INFO: Record<RowId, { name: string; detail: string }> = {
  db: { name: "Base de données", detail: "PostgreSQL · Docker · weems-db-1" },
  api: { name: "API", detail: "Fastify · pnpm --filter @weems/api dev" },
  site: { name: "Site web", detail: "Next.js · pnpm --filter @weems/web dev" },
  console: {
    name: "Console d'administration",
    detail: "Next.js · pnpm admin · trafic et activité simulés",
  },
};
const PILLS: Record<Exclude<RowState, "running">, string> = {
  starting: "Démarrage…",
  stopped: "Arrêté",
  error: "Erreur",
};
/** The API and the site depend on the console: its buttons act on everything. */
const CONSOLE_HINT = " tout (l'API et le site dépendent de la console)";

type Send = (command: LauncherCommand) => void;

export function element(tag: string, className: string, text?: string): HTMLElement {
  const created = document.createElement(tag);
  created.className = className;
  if (text !== undefined) created.textContent = text;
  return created;
}

function iconButton(icon: keyof typeof ICONS, title: string, onClick: () => void) {
  const button = element("button", "button icon") as HTMLButtonElement;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.innerHTML = ICONS[icon]; // static SVG of icons.ts, never a text from outside
  button.addEventListener("click", onClick);
  return button;
}

function rowText(row: Row): HTMLElement {
  const text = element("div", "row-text");
  const name = element("div", "row-name", INFO[row.id].name);
  if (row.state !== "running") name.append(element("span", `pill ${row.state}`, PILLS[row.state]));
  text.append(name, element("div", "row-detail", INFO[row.id].detail));
  if (row.note) text.append(element("div", "row-note", row.note));
  return text;
}

function rowButtons(row: Row, busy: boolean, send: Send): HTMLElement {
  const buttons = element("div", "row-buttons");
  const act = (action: "start" | "stop" | "restart") => () =>
    send({ type: "service", action, id: row.id });
  const hint = row.id === "console" ? CONSOLE_HINT : "";
  const shown =
    row.state === "running" || row.state === "starting"
      ? [
          iconButton("restart", `Redémarrer${hint}`, act("restart")),
          iconButton("stop", `Arrêter${hint}`, act("stop")),
        ]
      : [iconButton("start", `Démarrer${hint}`, act("start"))];
  for (const button of shown) button.disabled = busy;
  buttons.append(...shown);
  return buttons;
}

export function renderRow(row: Row, busy: boolean, send: Send): HTMLElement {
  const line = element("div", "row");
  const since = sinceText(row.since, Date.now());
  const meta = element("div", "row-meta", since ? `:${row.port} · ${since}` : `:${row.port}`);
  line.append(element("span", `dot ${row.state}`), rowText(row), meta, rowButtons(row, busy, send));
  return line;
}
