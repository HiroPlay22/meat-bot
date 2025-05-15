-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FunGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_FunGame" ("emoji", "id", "name") SELECT "emoji", "id", "name" FROM "FunGame";
DROP TABLE "FunGame";
ALTER TABLE "new_FunGame" RENAME TO "FunGame";
CREATE UNIQUE INDEX "FunGame_name_key" ON "FunGame"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
