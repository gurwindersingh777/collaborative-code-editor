import prisma from "../lib/prisma.js";
import { flushAllRooms } from "../services/roomAutosave.js";

let shuttingDown = false;

export async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, saving rooms...`);

  try {
    await flushAllRooms();
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }

  process.exit(0);
}
