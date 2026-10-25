import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "socket.io";

const mocks = vi.hoisted(() => ({ flush: vi.fn(), unregister: vi.fn(), release: vi.fn() }));

vi.mock("../src/services/roomAutosave.js", () => ({
  flushRoomSnapshot: mocks.flush,
  unregisterRoomDocument: mocks.unregister,
}));
vi.mock("../src/yjs/roomDocuments.js", () => ({ releaseRoomDocument: mocks.release }));

import { EVICT_AFTER_MS, cancelEviction, scheduleEviction } from "../src/services/roomLifecycle.js";
import { getLanguage, setLanguage } from "../src/socket/rooms/language.js";


function fakeIo(occupied: boolean): Server {
  const rooms = { get: () => (occupied ? new Set(["s1"]) : undefined) };
  return { sockets: { adapter: { rooms } } } as unknown as Server;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.flush.mockResolvedValue(undefined);
});

afterEach(() => {
  cancelEviction("r1");
  vi.useRealTimers();
});

describe("room cleanup", () => {
  it("frees an empty room after the delay, saving it first", async () => {
    setLanguage("r1", "python");
    scheduleEviction(fakeIo(false), "r1");

    await vi.advanceTimersByTimeAsync(EVICT_AFTER_MS - 1000);
    expect(mocks.release).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(mocks.flush).toHaveBeenCalledWith("r1");
    expect(mocks.release).toHaveBeenCalledWith("r1");
    expect(getLanguage("r1")).toBe("javascript"); // back to the default
  });

  it("keeps the room when someone came back", async () => {
    scheduleEviction(fakeIo(true), "r1");
    await vi.advanceTimersByTimeAsync(EVICT_AFTER_MS + 1000);
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("keeps the room in memory if the final save fails, then tries again", async () => {
    mocks.flush.mockRejectedValueOnce(new Error("db down"));
    scheduleEviction(fakeIo(false), "r1");

    await vi.advanceTimersByTimeAsync(EVICT_AFTER_MS + 1000);
    expect(mocks.release).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(EVICT_AFTER_MS + 1000);
    expect(mocks.release).toHaveBeenCalledWith("r1");
  });

  it("can be cancelled", async () => {
    scheduleEviction(fakeIo(false), "r1");
    cancelEviction("r1");
    await vi.advanceTimersByTimeAsync(EVICT_AFTER_MS + 1000);
    expect(mocks.release).not.toHaveBeenCalled();
  });
});