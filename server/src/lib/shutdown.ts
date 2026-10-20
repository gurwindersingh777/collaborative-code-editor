import prisma from "./prisma.js";
import { flushAllRooms } from "../services/roomAutosave.js";

let shuttingDown = false;

export async function shutdown(signal: string) {
  if (shuttingDown) return; // ignore a second Ctrl+C
  shuttingDown = true;
  console.log(`${signal} received, saving rooms...`);

  setTimeout(() => process.exit(1), 10_000).unref();

  try {
    await flushAllRooms();
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }

  process.exit(0);
}
