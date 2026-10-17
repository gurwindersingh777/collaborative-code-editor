-- DropIndex
DROP INDEX "Participant_roomId_idx";

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "hostUserId" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'javascript';
