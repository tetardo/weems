import { describe, expect, it } from "vitest";
import { isNextProcess, lockPid } from "./next-lock.ts";
import { lockHolderOf } from "./port-guard.ts";

describe("lock of next dev", () => {
  it("reads the pid Next.js writes in apps/web/.next/dev/lock", () => {
    expect(lockPid('{"pid":83030,"port":3001,"appUrl":"http://localhost:3001"}')).toBe(83030);
    expect(lockPid("")).toBeNull();
    expect(lockPid('{"port":3001}')).toBeNull();
  });

  it("recognises Next.js behind the pid, not a process that reused it", () => {
    expect(isNextProcess("next-server (v16.4.6)")).toBe(true);
    expect(isNextProcess("node /x/node_modules/.bin/../next/dist/bin/next dev --port 3001")).toBe(
      true,
    );
    expect(isNextProcess("/Applications/Safari.app/Contents/MacOS/Safari")).toBe(false);
    expect(isNextProcess("node nextcloud-sync.js")).toBe(false);
  });

  it("offers to stop an old site launch, never a program that is not Weems's", () => {
    const old = {
      kind: "process",
      name: "next-server (v16.4.6)",
      pid: 83030,
      weems: true,
    } as const;
    expect(lockHolderOf(old).freeable).toBe(true);
    expect(lockHolderOf(old).owner).toContain("83030");
    expect(lockHolderOf({ ...old, weems: false }).freeable).toBe(false);
  });
});
