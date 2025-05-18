/*
  Warnings:

  - Made the column `messageId` on table `Poll` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pollNumber` on table `Poll` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Poll` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Vote_userId_pollId_gameId_key";

-- CreateTable
CREATE TABLE "_PollGames" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PollGames_A_fkey" FOREIGN KEY ("A") REFERENCES "FunGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PollGames_B_fkey" FOREIGN KEY ("B") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pollNumber" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "winnerId" TEXT,
    CONSTRAINT "Poll_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "FunGame" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Poll" ("createdAt", "endedAt", "id", "messageId", "pollNumber", "question", "type", "winnerId") SELECT "createdAt", "endedAt", "id", "messageId", "pollNumber", "question", "type", "winnerId" FROM "Poll";
DROP TABLE "Poll";
ALTER TABLE "new_Poll" RENAME TO "Poll";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_PollGames_AB_unique" ON "_PollGames"("A", "B");

-- CreateIndex
CREATE INDEX "_PollGames_B_index" ON "_PollGames"("B");
