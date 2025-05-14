-- CreateTable
CREATE TABLE "CommandStat" (
    "command" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
