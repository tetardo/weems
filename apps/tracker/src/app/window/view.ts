import type { AppCommands, AppState } from "../app-state.ts";
import { MESSAGES, type MessageKey, PHASES } from "./messages.ts";

/** The window only displays the state and forwards clicks (architecture interne, part 7). */
declare global {
  interface Window {
    weems: AppCommands;
  }
}

const lang = navigator.language.startsWith("fr") ? "fr" : "en";
const text = (key: MessageKey) => MESSAGES[lang][key];
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

document.documentElement.lang = lang;
document.querySelectorAll<HTMLElement>("[data-text]").forEach((element) => {
  element.textContent = text(element.dataset["text"] as MessageKey);
});

function show(id: string, content: string, tone?: "ok" | "wait" | "ko"): void {
  const element = byId(id);
  element.textContent = content;
  element.className = tone ?? "";
}

function renderAccount(state: AppState): void {
  const status = state.loggingIn ? "loggingIn" : state.loggedIn ? "loggedIn" : "loggedOut";
  const tone = state.loggingIn ? "wait" : state.loggedIn ? "ok" : "ko";
  show("account-status", text(status), tone);
  byId("log-in").hidden = state.loggedIn || state.loggingIn;
  byId("log-out").hidden = !state.loggedIn;
}

function renderSimulator(state: AppState): void {
  const sim = { connected: "ok", loading: "wait", disconnected: "ko" } as const;
  show("simulator-status", text(state.simulator), sim[state.simulator]);
  byId("aircraft").textContent = state.aircraft ?? "";
}

function renderFlight(state: AppState): void {
  const phase = state.flight?.phase ? PHASES[lang][state.flight.phase] : "—";
  show("flight-status", state.flight ? `${text("phase")} : ${phase}` : text("noFlight"));
  byId("close-flight").hidden = !state.flight;
  if (state.blocked === "upgradeRequired") show("sending", text("upgradeRequired"), "ko");
  else if (state.pending === 0) show("sending", text("allSent"), "ok");
  else show("sending", `${state.pending} ${text("pending")}`, state.loggedIn ? "wait" : "ko");
}

let settingsShown = false;

/** Fills the form once: later states must not overwrite what the pilot is typing. */
function renderSettings(state: AppState): void {
  if (settingsShown) return;
  const form = byId<HTMLFormElement>("settings");
  for (const [name, value] of Object.entries(state.settings)) {
    (form.elements.namedItem(name) as HTMLInputElement).value = value;
  }
  settingsShown = true;
}

function render(state: AppState): void {
  byId("version").textContent = state.version;
  renderAccount(state);
  renderSimulator(state);
  renderFlight(state);
  renderSettings(state);
  byId("notice").textContent = state.notice ? text(state.notice as MessageKey) : "";
}

byId("log-in").addEventListener("click", () => void window.weems.logIn());
byId("log-out").addEventListener("click", () => void window.weems.logOut());
byId("close-flight").addEventListener("click", () => void window.weems.closeFlight());
byId<HTMLFormElement>("settings").addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(event.currentTarget as HTMLFormElement);
  const value = (name: string) =>
    String(fields.get(name) ?? "")
      .trim()
      .toUpperCase();
  void window.weems.saveSettings({
    callsign: value("callsign"),
    departureIcao: value("departureIcao"),
    arrivalIcao: value("arrivalIcao"),
  });
});
window.weems.onState(render);
