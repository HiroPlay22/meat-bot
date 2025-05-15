/*
  Warnings:

  - You are about to drop the column `createdAt` on the `FunGame` table. All the data in the column will be lost.
  - You are about to drop the column `isFree` on the `FunGame` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FunGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT
);
INSERT INTO "new_FunGame" ("id", "name") SELECT "id", "name" FROM "FunGame";
DROP TABLE "FunGame";
ALTER TABLE "new_FunGame" RENAME TO "FunGame";
CREATE TABLE "new_Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "winnerId" TEXT,
    "pollNumber" INTEGER,
    "type" TEXT,
    "messageId" TEXT,
    CONSTRAINT "Poll_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "FunGame" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Poll" ("createdAt", "endedAt", "id", "question", "winnerId") SELECT "createdAt", "endedAt", "id", "question", "winnerId" FROM "Poll";
DROP TABLE "Poll";
ALTER TABLE "new_Poll" RENAME TO "Poll";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
