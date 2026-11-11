/**
 * One instance per console process, kept on globalThis: Next.js reloads modules in development,
 * and a reload must not forget the processes the console started.
 */
export function singleton<T>(name: string, create: () => T): T {
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  const key = Symbol.for(`weems.admin.${name}`);
  store[key] ??= create();
  return store[key];
}
