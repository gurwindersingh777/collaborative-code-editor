import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanName, toBytes } from "../src/socket/helpers.js";
import { isLanguage } from "../src/types/language.js";
import { toExecutionResult } from "../src/services/piston.js";
import { getTimerPayload, pauseTimer, resetTimer, startTimer } from "../src/socket/rooms/timer.js";
import { addChatMessage, getChatHistory } from "../src/socket/rooms/chat.js";

describe("cleanName", () => {
  it("trims and collapses spaces", () => {
    expect(cleanName("   a    b   ")).toBe("a b");
  });
  it("cuts names to 30 characters", () => {
    expect(cleanName("x".repeat(500))).toHaveLength(30);
  });
  it("rejects empty and non-string values", () => {
    expect(cleanName("   ")).toBeNull();
    expect(cleanName(null)).toBeNull();
    expect(cleanName(42)).toBeNull();
  });
});

describe("toBytes", () => {
  it("accepts binary data", () => {
    expect(toBytes(new Uint8Array([1, 2]))).toEqual(new Uint8Array([1, 2]));
    expect(toBytes(new Uint8Array([3]).buffer)).toEqual(new Uint8Array([3]));
  });
  it("rejects arrays, strings and null", () => {
    expect(toBytes([1, 2, 3])).toBeNull();
    expect(toBytes("abc")).toBeNull();
    expect(toBytes(null)).toBeNull();
  });
});

describe("isLanguage", () => {
  it("accepts supported languages only", () => {
    expect(isLanguage("python")).toBe(true);
    expect(isLanguage("cpp")).toBe(true);
    expect(isLanguage("ruby")).toBe(false);
  });
  it("is not fooled by object property names", () => {
    expect(isLanguage("constructor")).toBe(false);
    expect(isLanguage("toString")).toBe(false);
    expect(isLanguage("__proto__")).toBe(false);
  });
});

const stage = (over = {}) => ({ stdout: "", stderr: "", code: 0, signal: null, ...over });

describe("toExecutionResult", () => {
  it("reports a successful run", () => {
    const result = toExecutionResult({ run: stage({ stdout: "hi\n" }) });
    expect(result).toMatchObject({ success: true, stdout: "hi\n" });
  });
  it("shows the compiler's message when compilation fails", () => {
    const result = toExecutionResult({
      compile: stage({ code: 1, stderr: "main.cpp:1:14: error: expected expression" }),
    });
    expect(result).toMatchObject({
      success: false,
      status: "CE",
      message: "Compilation failed.",
      stderr: expect.stringContaining("expected expression"),
    });
  });
  it("explains a timeout", () => {
    const result = toExecutionResult({
      run: stage({ code: null, signal: "SIGKILL", status: "TO", message: "Time limit exceeded (wall clock)" }),
    });
    expect(result).toMatchObject({ success: false, status: "TO" });
    expect(result?.message).toContain("Time limit");
  });
  it("returns null when Piston sent no result", () => {
    expect(toExecutionResult({})).toBeNull();
  });
});

describe("session timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => vi.useRealTimers());

  it("adds up running time across pauses, in milliseconds", () => {
    startTimer("room-a");
    vi.advanceTimersByTime(700);
    pauseTimer("room-a");
    vi.advanceTimersByTime(5000); // paused time must not count
    startTimer("room-a");
    vi.advanceTimersByTime(700);
    pauseTimer("room-a");
    expect(getTimerPayload("room-a").elapsed).toBe(1400);
  });

  it("does not restart when started twice", () => {
    startTimer("room-b");
    vi.advanceTimersByTime(1000);
    startTimer("room-b");
    vi.advanceTimersByTime(1000);
    pauseTimer("room-b");
    expect(getTimerPayload("room-b").elapsed).toBe(2000);
  });

  it("resets to zero and includes the server clock", () => {
    startTimer("room-c");
    vi.advanceTimersByTime(3000);
    resetTimer("room-c");
    const payload = getTimerPayload("room-c");
    expect(payload).toMatchObject({ running: false, elapsed: 0, startedAt: null });
    expect(payload.serverNow).toBe(Date.now());
  });
});

describe("chat history", () => {
  it("keeps only the newest 50 messages", () => {
    for (let i = 0; i < 55; i++) {
      addChatMessage("chat-r", { id: String(i), roomId: "chat-r", user: { name: "a", color: "#3B82F6" }, message: `m${i}`, timestamp: i });
    }
    const history = getChatHistory("chat-r");
    expect(history).toHaveLength(50);
    expect(history[0].message).toBe("m5");
  });
});