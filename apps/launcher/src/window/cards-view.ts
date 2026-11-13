import type { LauncherOverview } from "@weems/contrats";
import { type Card, cardsOf, type Ring } from "./cards.ts";
import { percentText } from "./format.ts";
import { element } from "./rows-view.ts";

const SVG = "http://www.w3.org/2000/svg";
const RADIUS = 15.9155; // circumference 100: the dash is the percentage

function circle(className: string, dash?: number): SVGCircleElement {
  const created = document.createElementNS(SVG, "circle");
  created.setAttribute("class", className);
  created.setAttribute("cx", "18");
  created.setAttribute("cy", "18");
  created.setAttribute("r", String(RADIUS));
  if (dash !== undefined) created.setAttribute("stroke-dasharray", `${dash} 100`);
  return created;
}

/** Progress circle: track, arc from the top, percentage inside, caption below. */
function renderRing({ share, tone, caption }: Ring): HTMLElement {
  const box = element("div", `ring ${tone}`);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 36 36");
  svg.setAttribute("aria-hidden", "true");
  svg.append(circle("ring-track"), circle("ring-arc", Math.round(share * 1000) / 10));
  const dial = element("div", "ring-dial");
  dial.append(svg, element("span", "ring-percent", percentText(share)));
  box.append(dial, element("span", "ring-caption", caption));
  return box;
}

function renderCard(card: Card): HTMLElement {
  const box = element("section", `card${card.half ? " half" : ""}`);
  const title = element("h2", "card-title", card.title);
  const text = element("div", "card-text");
  text.append(
    title,
    element("div", `card-value ${card.tone ?? ""}`, card.value),
    ...card.lines.map(({ text, tone }) => element("p", `card-line ${tone ?? ""}`, text)),
  );
  box.append(text);
  if (card.ring) box.append(renderRing(card.ring));
  return box;
}

const stackOf = (cards: HTMLElement[]) => {
  const stack = element("div", "card-stack");
  stack.append(...cards);
  return stack;
};

export function renderCards(overview: LauncherOverview | null): void {
  const cards = cardsOf(overview, Date.now()).map(renderCard);
  const [users, revenue, ...halves] = cards;
  document
    .getElementById("cards")
    ?.replaceChildren(
      ...[users, revenue].filter((card) => card !== undefined),
      stackOf(halves.slice(0, 2)),
      stackOf(halves.slice(2)),
    );
}
