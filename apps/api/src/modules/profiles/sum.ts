/** Sum of some numbers; 0 when there are none. */
export const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);
