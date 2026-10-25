import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import * as Y from "yjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// No real database in tests: the first person to join a room counts as its host.
vi.mock("../src/services/roomPersistence.js", () => {
  const hosts = new Map<string, string>();
  return {
    ensureRoom: vi.fn(async () => { }),
    recordJoin: vi.fn(async (roomId: string, user: { id: string }) => {
      if (!hosts.has(roomId)) hosts.set(roomId, user.id);
      return { isHost: hosts.get(roomId) === user.id, language: "javascript" };
    }),
    saveLanguage: vi.fn(async () => { }),
    saveParticipantName: vi.fn(async () => { }),
    saveSnapshot: vi.fn(async () => { }),
    loadLatestSnapshot: vi.fn(async () => null),
  };
});

type Io = Awaited<ReturnType<(typeof import("../src/socket/index.js"))["createSocketServer"]>>;

let io: Io;
let url: string;
const sockets: Socket[] = [];

beforeAll(async () => {
  const { createSocketServer } = await import("../src/socket/index.js");
  const httpServer = createServer();
  io = createSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  sockets.forEach((socket) => socket.disconnect());
  const { flushAllRooms } = await import("../src/services/roomAutosave.js"); // also stops its timer
  await flushAllRooms();
  await new Promise<void>((resolve) => io.close(() => resolve()));
});

function newSocket(): Socket {
  const socket = connect(url, { transports: ["websocket"], forceNew: true });
  sockets.push(socket);
  return socket;
}

// A fake browser: the same relay logic as client/src/lib/yjsSync.ts, plus the state we want to check
async function join(roomId: string, name: string) {
  const socket = newSocket();
  const doc = new Y.Doc();
  const state = {
    users: [] as { name: string }[],
    role: null as string | null,
    locked: false,
    language: "",
    chat: [] as string[],
  };

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "remote") socket.emit("yjs-update", { roomId, update });
  });
  socket.on("yjs-update", (data) => Y.applyUpdate(doc, new Uint8Array(data.update), "remote"));
  socket.on("yjs-sync", (data) => Y.applyUpdate(doc, new Uint8Array(data.update), "remote"));
  socket.on("presence-state", (data) => { state.users = data.users; });
  socket.on("interview-role", (role) => { state.role = role; });
  socket.on("interviewer-mode-state", (enabled) => { state.locked = enabled; });
  socket.on("language-state", (language) => { state.language = language; });
  socket.on("chat-history", (data) => {
    state.chat = data.messages.map((m: { message: string }) => m.message);
  });
  socket.on("chat-message", (m) => { state.chat.push(m.message); });

  await new Promise<void>((resolve) => socket.on("connect", () => resolve()));
  const synced = new Promise<void>((resolve) => socket.once("yjs-sync", () => resolve()));
  socket.emit("join-room", { roomId, user: { id: `${name}-id`, name, color: "#3B82F6" } });
  await synced;

  return { socket, doc, state, text: () => doc.getText("code").toString() };
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const eventually = (check: () => void) => vi.waitFor(check, { timeout: 3000 });

describe("real-time sync", () => {
  it("merges two people typing at the same moment", async () => {
    const a = await join("converge", "alice");
    const b = await join("converge", "bob");

    a.doc.getText("code").insert(0, "hello ");
    b.doc.getText("code").insert(0, "world ");

    await eventually(() => {
      expect(a.text()).toBe(b.text());
      expect(a.text()).toContain("hello");
      expect(a.text()).toContain("world");
    });
  });

  it("gives a late joiner the code written so far", async () => {
    const a = await join("late", "alice");
    const b = await join("late", "bob");
    a.doc.getText("code").insert(0, "const x = 1;");
    await eventually(() => expect(b.text()).toBe("const x = 1;"));

    const c = await join("late", "carol");
    expect(c.text()).toBe("const x = 1;");
  });

  it("ignores a garbage update and keeps working", async () => {
    const a = await join("garbage", "alice");
    const b = await join("garbage", "bob");

    b.socket.emit("yjs-update", { roomId: "garbage", update: new Uint8Array([1, 2, 3]) });
    await pause(200);

    b.doc.getText("code").insert(0, "still works");
    await eventually(() => expect(a.text()).toBe("still works"));
  });
});

describe("permissions", () => {
  it("first person is the interviewer; a locked candidate cannot edit", async () => {
    const host = await join("lock", "alice");
    const guest = await join("lock", "bob");
    expect(host.state.role).toBe("interviewer");
    expect(guest.state.role).toBe("candidate");

    host.socket.emit("request-interviewer-mode", { roomId: "lock", enabled: true });
    await eventually(() => expect(guest.state.locked).toBe(true));

    guest.doc.getText("code").insert(0, "hack");
    await pause(300);
    expect(host.text()).not.toContain("hack"); // the server refused it

    host.doc.getText("code").insert(0, "ok");
    await eventually(() => expect(guest.text()).toContain("ok")); // the host can still edit
  });

  it("a candidate cannot lock the room", async () => {
    await join("nolock", "alice");
    const guest = await join("nolock", "bob");

    guest.socket.emit("request-interviewer-mode", { roomId: "nolock", enabled: true });
    await pause(300);
    expect(guest.state.locked).toBe(false);
  });

  it("someone who never joined cannot write or run code", async () => {
    const a = await join("private", "alice");
    const outsider = newSocket();
    await new Promise<void>((resolve) => outsider.on("connect", () => resolve()));

    const stranger = new Y.Doc();
    stranger.getText("code").insert(0, "x");
    outsider.emit("yjs-update", { roomId: "private", update: Y.encodeStateAsUpdate(stranger) });
    await pause(300);
    expect(a.text()).toBe("");

    const reply = await new Promise((resolve) => outsider.emit("run-code", { roomId: "private" }, resolve));
    expect(reply).toEqual({ ok: false, error: "You are not in this room." });
  });
});

describe("presence", () => {
  it("everyone sees the same list, and it shrinks when someone leaves", async () => {
    const a = await join("people", "alice");
    const b = await join("people", "bob");

    await eventually(() => {
      expect(a.state.users.map((u) => u.name).sort()).toEqual(["alice", "bob"]);
      expect(b.state.users.map((u) => u.name).sort()).toEqual(["alice", "bob"]);
    });

    b.socket.disconnect();
    await eventually(() => expect(a.state.users.map((u) => u.name)).toEqual(["alice"]));
  });
});

describe("language", () => {
  it("a new room starts empty, and switching language never touches the code", async () => {
    const a = await join("lang-code", "alice");
    const b = await join("lang-code", "bob");
    expect(a.text()).toBe("");

    a.doc.getText("code").insert(0, "x = 1");
    await eventually(() => expect(b.text()).toBe("x = 1"));

    // Both people switch language several times, at the same moment
    for (const language of ["python", "java", "cpp", "go"]) {
      a.socket.emit("set-language", "lang-code", language);
      b.socket.emit("set-language", "lang-code", language === "java" ? "c" : "typescript");
    }
    await pause(400);

    expect(a.text()).toBe("x = 1");
    expect(b.text()).toBe("x = 1");
    await eventually(() => expect(a.state.language).toBe(b.state.language));
  });

  it("everyone sees the new language, and unknown languages are ignored", async () => {
    const a = await join("lang-sync", "alice");
    const b = await join("lang-sync", "bob");
    expect(b.state.language).toBe("javascript");

    a.socket.emit("set-language", "lang-sync", "python");
    await eventually(() => expect(b.state.language).toBe("python"));

    a.socket.emit("set-language", "lang-sync", "ruby");
    await pause(300);
    expect(b.state.language).toBe("python");
  });
});

describe("chat history", () => {
  it("sends recent chat to someone who joins late", async () => {
    const a = await join("chat-room", "alice");
    a.socket.emit("send-chat-message", { roomId: "chat-room", message: "hello there" });
    await eventually(() => expect(a.state.chat).toContain("hello there"));

    const b = await join("chat-room", "bob");
    expect(b.state.chat).toEqual(["hello there"]);
  });
});