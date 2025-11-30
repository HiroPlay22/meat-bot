/*
  Warnings:

  - You are about to drop the column `closedAt` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `discordChannelId` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `discordMessageId` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Poll` table. All the data in the column will be lost.
  - Added the required column `channelId` to the `Poll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageId` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Poll_guildId_type_status_idx";

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "closedAt",
DROP COLUMN "createdByUserId",
DROP COLUMN "discordChannelId",
DROP COLUMN "discordMessageId",
DROP COLUMN "endsAt",
DROP COLUMN "status",
ADD COLUMN     "channelId" VARCHAR(32) NOT NULL,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "messageId" VARCHAR(32) NOT NULL,
ALTER COLUMN "startedAt" DROP DEFAULT;

-- DropEnum
DROP TYPE "PollStatus";

-- CreateTable
CREATE TABLE "PollGame" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "maxPlayers" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PollGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PollGame_name_key" ON "PollGame"("name");
