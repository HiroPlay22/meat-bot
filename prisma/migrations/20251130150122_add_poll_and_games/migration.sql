/*
  Warnings:

  - You are about to drop the column `startedAt` on the `Poll` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PollGame_name_key";

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "startedAt",
ADD COLUMN     "winnerGameId" TEXT;

-- AlterTable
ALTER TABLE "PollGame" ADD COLUMN     "lastPlayedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "poll_guild_type_endedAt" ON "Poll"("guildId", "type", "endedAt");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_winnerGameId_fkey" FOREIGN KEY ("winnerGameId") REFERENCES "PollGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
