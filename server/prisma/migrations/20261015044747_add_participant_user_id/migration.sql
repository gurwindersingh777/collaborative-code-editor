/*
  Warnings:

  - A unique constraint covering the columns `[roomId,userId]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_roomId_userId_key" ON "Participant"("roomId", "userId");
