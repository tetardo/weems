/**
 * Order of the letters on a split-flap drum: a cell turns forward through it until it shows its
 * new character, as on an airport board (Solari).
 */
export const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:.";

/** Text padded or cut to `width` cells, in capitals; an unknown character is kept as is. */
export function toCells(text: string, width: number): string[] {
  return [...text.toUpperCase().padEnd(width, " ")].slice(0, width);
}

/** The character after `current` on the drum, or `target` at once when either is not on it. */
export function nextOnDrum(current: string, target: string): string {
  if (current === target) return current;
  const from = DRUM.indexOf(current);
  if (from < 0 || !DRUM.includes(target)) return target;
  return DRUM[(from + 1) % DRUM.length] ?? target;
}

/**
 * One step of the animation: every cell not yet showing its target turns one flap. `moved` says
 * how many turned (0: the text is shown, the animation stops).
 */
export function rollStep(
  shown: readonly string[],
  target: readonly string[],
): { cells: string[]; moved: number } {
  let moved = 0;
  const cells = target.map((goal, index) => {
    const current = shown[index] ?? " ";
    if (current === goal) return current;
    moved += 1;
    return nextOnDrum(current, goal);
  });
  return { cells, moved };
}
