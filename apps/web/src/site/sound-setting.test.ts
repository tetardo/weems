import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { siteAudio, writeSound } from "./sound-setting.ts";

describe("sound setting", () => {
  let stored: Map<string, string>;
  let events: string[];
  beforeEach(() => {
    stored = new Map();
    events = [];
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    });
    vi.stubGlobal("window", { dispatchEvent: (event: Event) => events.push(event.type) });
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "suspended";
        resume() {
          this.state = "running";
          return Promise.resolve();
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("remembers the choice and tells the page", () => {
    writeSound(true);
    expect(stored.get("weems-sound")).toBe("on");
    writeSound(false);
    expect(stored.get("weems-sound")).toBe("off");
    expect(events).toEqual(["weems-sound-change", "weems-sound-change"]);
  });

  it("starts the sound in the click that turns it on (browsers allow it only then)", () => {
    writeSound(true);
    expect(siteAudio().state).toBe("running");
  });

  it("still tells the page when storage is refused", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("private mode");
      },
    });
    writeSound(true);
    expect(events).toEqual(["weems-sound-change"]);
  });
});
