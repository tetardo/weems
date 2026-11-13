/** Language the language button leads to: the next one in the list, back to the first after the last. */
export function nextLocale<L extends string>(locales: readonly L[], current: string): L {
  const index = locales.indexOf(current as L);
  return locales[(index + 1) % locales.length] as L;
}
