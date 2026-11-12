import { describe, expect, it } from "vitest";
import { holderOf } from "./port-guard.ts";
import { isWeemsContainer, isWeemsProcess } from "./port-owner.ts";

describe("holderOf", () => {
  it("offers to free a port held by an old Weems container", () => {
    const holder = holderOf(3000, { kind: "docker", name: "weems-api-1", pid: null, weems: true });
    expect(holder.freeable).toBe(true);
    expect(holder.owner).toContain("weems-api-1");
  });

  it("never offers to free a program that is not Weems's", () => {
    const owner = { kind: "process", name: "/usr/bin/other", pid: 42, weems: false } as const;
    expect(holderOf(3001, owner).freeable).toBe(false);
    expect(holderOf(3001, null).message).toContain("lsof -i :3001");
  });
});

describe("Weems or not", () => {
  it("knows the containers of the weems project and the processes of the repository", () => {
    expect(isWeemsContainer("weems-api-1")).toBe(true);
    expect(isWeemsContainer("gamelab-web-1")).toBe(false);
    const root = "/Users/Gregory/Projets/weems-code";
    expect(isWeemsProcess(`node ${root}/node_modules/.bin/next dev`, "/", root)).toBe(true);
    expect(isWeemsProcess("next-server (v16.4.6)", `${root}/apps/web`, root)).toBe(true);
    expect(isWeemsProcess("next-server (v16.4.6)", `${root}-old/apps/web`, root)).toBe(false);
    expect(isWeemsProcess("node server.js", "/Users/Gregory/Projets/Gamelab", root)).toBe(false);
  });
});
