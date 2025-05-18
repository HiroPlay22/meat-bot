/*
  Warnings:

  - Added the required column `protocolNo` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolNo" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "module" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Feedback" ("category", "createdAt", "description", "fileUrl", "id", "importance", "module", "serverId", "title", "userId", "username") SELECT "category", "createdAt", "description", "fileUrl", "id", "importance", "module", "serverId", "title", "userId", "username" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
CREATE UNIQUE INDEX "Feedback_protocolNo_key" ON "Feedback"("protocolNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
