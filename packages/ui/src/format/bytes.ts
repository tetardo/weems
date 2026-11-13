const fr = (value: number, digits: number) =>
  value.toLocaleString("fr-FR", { maximumFractionDigits: digits });

/** « 412 Mo », « 1,2 Go », « 3,4 Mo », « 820 ko ». */
export function bytes(value: number): string {
  if (value >= 1e9) return `${fr(value / 1e9, 1)} Go`;
  if (value >= 1e6) return `${fr(value / 1e6, value < 1e7 ? 1 : 0)} Mo`;
  return `${fr(value / 1e3, 0)} ko`;
}
