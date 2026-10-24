import { afterEach, describe, expect, it, vi } from "vitest";

// The limiter keeps its state at module level, so every test loads a fresh copy
async function load() {
  vi.resetModules();
  return import("../src/services/runLimiter.js");
}

afterEach(() => vi.useRealTimers());

describe("run limiter", () => {
  it("allows one run per room at a time", async () => {
    const { tryStartRun, finishRun } = await load();
    expect(tryStartRun("r1", "s1")).toBeNull();
    expect(tryStartRun("r1", "s2")).toMatch(/already in progress/);
    finishRun("r1");
    expect(tryStartRun("r1", "s2")).toBeNull();
  });

  it("allows at most 4 runs at once on the whole server", async () => {
    const { tryStartRun } = await load();
    for (const room of ["a", "b", "c", "d"]) expect(tryStartRun(room, `s-${room}`)).toBeNull();
    expect(tryStartRun("e", "s-e")).toMatch(/busy/);
  });

  it("limits each connection to 10 runs a minute", async () => {
    vi.useFakeTimers();
    const { tryStartRun, finishRun } = await load();

    for (let i = 0; i < 10; i++) {
      expect(tryStartRun(`room-${i}`, "s1")).toBeNull();
      finishRun(`room-${i}`);
    }
    expect(tryStartRun("room-x", "s1")).toMatch(/Too many runs/);

    vi.advanceTimersByTime(61_000);
    expect(tryStartRun("room-x", "s1")).toBeNull();
  });
});