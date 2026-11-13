import type { LauncherBridge, LauncherState, LinkTarget, RowId } from "../launcher-state.ts";
import { lineKind, plainText } from "./format.ts";
import { ICONS } from "./icons.ts";
import { renderCards } from "./cards-view.ts";
import { renderPowerMenu, setupMenus } from "./menus.ts";
import { element, renderRow } from "./rows-view.ts";

/** The launcher's window: shows the state sent by the main process, sends the clicks back. */
declare global {
  interface Window {
    weems: LauncherBridge;
  }
}

const bridge = window.weems;
const byId = (id: string) => document.getElementById(id) as HTMLElement;

function renderHead(state: LauncherState): void {
  const running = state.rows.filter((row) => row.state === "running").length;
  const total = state.rows.length;
  const dot =
    state.busy || (running > 0 && running < total) ? "starting" : running ? "running" : "stopped";
  byId("summary").querySelector(".dot")?.setAttribute("class", `dot ${dot}`);
  byId("summary-text").textContent = state.busy ?? `${running} sur ${total} en marche`;
  renderPowerMenu(running, state.busy !== null);
  const notice = byId("notice");
  notice.hidden = state.notice === null;
  notice.textContent = state.notice;
}

function renderLogs(state: LauncherState): void {
  const logs = byId("logs");
  const atBottom = logs.scrollTop + logs.clientHeight >= logs.scrollHeight - 8;
  const lines = state.logs.map((raw) => {
    const text = plainText(raw);
    const kind = lineKind(text);
    return kind ? element("span", kind, `${text}\n`) : document.createTextNode(`${text}\n`);
  });
  logs.replaceChildren(...lines);
  if (atBottom) logs.scrollTop = logs.scrollHeight;
  byId("logs-count").textContent = `${state.logs.length} dernières lignes`;
  for (const tab of byId("tabs").querySelectorAll("button")) {
    tab.classList.toggle("on", tab.dataset["tab"] === state.tab);
  }
}

function render(state: LauncherState): void {
  renderHead(state);
  renderCards(state.overview);
  const rows = state.rows.map((row) => renderRow(row, state.busy !== null, bridge.send));
  byId("rows").replaceChildren(...rows);
  renderLogs(state);
}

for (const tab of byId("tabs").querySelectorAll("button")) {
  tab.addEventListener("click", () =>
    bridge.send({ type: "tab", tab: tab.dataset["tab"] as RowId }),
  );
}
for (const link of document.querySelectorAll<HTMLButtonElement>("[data-open]")) {
  link.addEventListener("click", () =>
    bridge.send({ type: "open", target: link.dataset["open"] as LinkTarget }),
  );
}
for (const holder of document.querySelectorAll<HTMLElement>("[data-icon]")) {
  holder.insertAdjacentHTML("afterbegin", ICONS[holder.dataset["icon"] as keyof typeof ICONS]);
}
setupMenus(bridge.send);
bridge.onState(render);
