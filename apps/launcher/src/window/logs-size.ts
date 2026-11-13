import { ICONS } from "./icons.ts";

/** Button « Agrandir » of the logs bar (Greg, 13/11): the logs take the whole window, or not. */
export function setupLogsSize(): void {
  const button = document.getElementById("logs-size") as HTMLButtonElement;
  const show = (large: boolean) => {
    document.body.classList.toggle("logs-large", large);
    const label = large ? "Réduire les journaux" : "Agrandir les journaux";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(large));
    button.innerHTML = ICONS[large ? "shrink" : "expand"]; // static SVG of icons.ts
  };
  button.addEventListener("click", () => show(!document.body.classList.contains("logs-large")));
  show(false);
}
