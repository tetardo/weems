import type { FlightPhase, Sample } from "@weems/contrats";
import { beforeEach, describe, expect, it } from "vitest";
import { RUNNING, sample } from "../testing/sample.ts";
import { AIRLINER_PARAMS } from "./params.ts";
import { PhaseMachine, type PhaseOutput } from "./phase-machine.ts";

let machine: PhaseMachine;
let t: number;
let outputs: PhaseOutput[];

/** Feeds the same state for `seconds` seconds, one sample per second. */
function hold(seconds: number, state: Partial<Sample>): void {
  for (let i = 0; i < seconds; i++) {
    t += 1000;
    outputs.push(...machine.feed(sample({ t, ...state })));
  }
}

/** Puts the machine in `phase` through the regular path (start on the ground). */
function reach(phase: FlightPhase, state: Partial<Sample>): void {
  hold(1, state);
  expect(machine.phase).toBe(phase);
  outputs = [];
}

const kinds = () => outputs.map((o) => (o.kind === "phaseChanged" ? o.to : o.kind));

const taxi = { engines: RUNNING, gs: 15, parkingBrake: false };
const air = (altAgl: number, vs: number, gs = 250) => ({
  onGround: false,
  altAgl,
  vs,
  gs,
  engines: RUNNING,
});

beforeEach(() => {
  machine = new PhaseMachine(AIRLINER_PARAMS);
  t = 0;
  outputs = [];
});

describe("start", () => {
  it("starts in BOARDING on the ground", () => {
    reach("BOARDING", {});
  });

  it("starts in CRUISE when loaded level in the air, marked as an air start", () => {
    hold(1, air(30000, 0));
    expect(outputs).toEqual([
      { kind: "phaseChanged", t: 1000, from: null, to: "CRUISE", airStart: true },
    ]);
  });

  it("starts in CLIMB when loaded climbing in the air", () => {
    hold(1, air(5000, 1500));
    expect(machine.phase).toBe("CLIMB");
  });
});

describe("confirmation durations", () => {
  it("waits 2 s of pushback before PUSHBACK", () => {
    reach("BOARDING", {});
    hold(2, { pushback: true });
    expect(machine.phase).toBe("BOARDING");
    hold(1, { pushback: true });
    expect(machine.phase).toBe("PUSHBACK");
  });

  it("restarts the confirmation when the condition stops holding", () => {
    reach("BOARDING", {});
    hold(2, { pushback: true });
    hold(1, { pushback: false });
    hold(2, { pushback: true });
    expect(machine.phase).toBe("BOARDING");
  });

  it("counts simulated time: 60 s of level flight take 15 s at ×4", () => {
    reach("CLIMB", air(20000, 2000));
    hold(16, { ...air(30000, 0), simRate: 4 });
    expect(machine.phase).toBe("CRUISE");
  });

  it("evaluates nothing while paused", () => {
    reach("CLIMB", air(20000, 2000));
    hold(120, { ...air(30000, 0), paused: true });
    expect(machine.phase).toBe("CLIMB");
  });
});

describe("ground phases", () => {
  it("goes from BOARDING to TAXI_OUT without pushback after 5 s", () => {
    reach("BOARDING", {});
    hold(6, taxi);
    expect(kinds()).toEqual(["TAXI_OUT"]);
  });

  it("starts the take-off roll only while accelerating above 40 kt", () => {
    reach("BOARDING", {});
    hold(6, taxi);
    hold(5, { ...taxi, gs: 50 });
    expect(machine.phase).toBe("TAXI_OUT");
    for (let gs = 50; gs < 70; gs += 4) hold(1, { ...taxi, gs });
    expect(machine.phase).toBe("TAKEOFF");
  });

  it("detects a rejected take-off", () => {
    reach("BOARDING", {});
    hold(6, taxi);
    for (let gs = 20; gs < 80; gs += 4) hold(1, { ...taxi, gs });
    hold(4, { ...taxi, gs: 20 });
    expect(kinds()).toContain("rejectedTakeoff");
    expect(machine.phase).toBe("TAXI_OUT");
  });
});

describe("air phases", () => {
  it("lifts off to CLIMB 3 s above 50 ft", () => {
    reach("BOARDING", {});
    hold(6, taxi);
    for (let gs = 20; gs < 160; gs += 4) hold(1, { ...taxi, gs });
    hold(4, air(200, 2000, 160));
    expect(machine.phase).toBe("CLIMB");
  });

  it("follows CLIMB, CRUISE, DESCENT, APPROACH, FINAL", () => {
    reach("CLIMB", air(20000, 2000));
    hold(61, air(35000, 0));
    hold(31, air(30000, -2000));
    hold(11, air(2500, -1000));
    hold(4, { ...air(900, -700), gearHandle: 1 });
    expect(kinds()).toEqual(["CRUISE", "DESCENT", "APPROACH", "FINAL"]);
  });

  it("does not enter FINAL with the gear up", () => {
    reach("CLIMB", air(20000, 2000));
    hold(31, air(20000, -2000));
    hold(11, air(2500, -1000));
    hold(10, { ...air(900, -700), gearHandle: 0 });
    expect(machine.phase).toBe("APPROACH");
  });

  it("detects a go-around from the lowest point of the approach", () => {
    reach("CLIMB", air(20000, 2000));
    hold(31, air(20000, -2000));
    hold(11, air(2500, -1000));
    hold(4, air(300, -700));
    hold(6, air(600, 1500));
    expect(kinds()).toEqual(["DESCENT", "APPROACH", "FINAL", "goAround", "CLIMB"]);
  });
});

describe("landing", () => {
  function onFinal(): void {
    reach("CLIMB", air(20000, 2000));
    hold(31, air(20000, -2000));
    hold(11, air(2500, -1000));
    hold(4, air(500, -700));
    outputs = [];
  }

  it("records the touchdown immediately, with its vertical speed", () => {
    onFinal();
    hold(1, { engines: RUNNING, gs: 130, vs: -180 });
    expect(outputs).toEqual([
      { kind: "touchdown", t, vs: -180 },
      { kind: "phaseChanged", t, from: "FINAL", to: "LANDING" },
    ]);
  });

  it("counts a bounce when airborne again for less than 5 s", () => {
    onFinal();
    hold(1, { engines: RUNNING, gs: 130 });
    hold(2, air(5, 100, 125));
    hold(1, { engines: RUNNING, gs: 120 });
    expect(kinds()).toEqual(["touchdown", "LANDING", "bounce"]);
  });

  it("sees a touch-and-go when airborne for more than 5 s above 50 ft", () => {
    onFinal();
    hold(1, { engines: RUNNING, gs: 130 });
    hold(7, air(300, 1000, 140));
    expect(kinds()).toEqual(["touchdown", "LANDING", "touchAndGo", "CLIMB"]);
  });

  it("ends the landing roll below 40 kt, then arrives once parked with engines off", () => {
    onFinal();
    hold(1, { engines: RUNNING, gs: 130 });
    hold(4, { engines: RUNNING, gs: 30 });
    hold(10, { engines: RUNNING, gs: 0, parkingBrake: true });
    hold(11, { gs: 0, parkingBrake: true });
    expect(kinds()).toEqual(["touchdown", "LANDING", "TAXI_IN", "ARRIVED"]);
  });

  it("without parking brake data, arrives after 30 s stopped with engines off", () => {
    onFinal();
    hold(1, { engines: RUNNING, gs: 130 });
    hold(4, { engines: RUNNING, gs: 30 });
    hold(30, { gs: 0, parkingBrake: null });
    expect(machine.phase).toBe("TAXI_IN");
    hold(1, { gs: 0, parkingBrake: null });
    expect(machine.phase).toBe("ARRIVED");
  });
});

describe("close", () => {
  it("ends the flight from any phase, once", () => {
    reach("CRUISE", air(30000, 0));
    expect(machine.close(t)).toEqual({ kind: "phaseChanged", t, from: "CRUISE", to: "ARRIVED" });
    expect(machine.close(t)).toBeNull();
  });
});
