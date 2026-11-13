/** Runs `work` on every item, `concurrency` at a time, until the signal stops it. */
export async function pool<T>(
  items: readonly T[],
  concurrency: number,
  work: (item: T) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length && !signal?.aborted) {
      const item = items[next++] as T;
      await work(item);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}
