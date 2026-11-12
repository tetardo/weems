/** Where the pointer is over the map, in pixels from its top left corner. */
export interface MapPoint {
  x: number;
  y: number;
}

export const CARD_WIDTH = 300;
/** Gap between the aircraft and the card. */
const GAP = 28;
/** Below the floating bar. */
const MIN_TOP = 84;

/** Left of the aircraft when the card would leave the map on the right. */
export function cardPosition(point: MapPoint, mapWidth: number): { left: number; top: number } {
  const right = point.x + GAP + CARD_WIDTH <= mapWidth - 12;
  return {
    left: right ? point.x + GAP : point.x - GAP - CARD_WIDTH,
    top: Math.max(MIN_TOP, point.y - 60),
  };
}
