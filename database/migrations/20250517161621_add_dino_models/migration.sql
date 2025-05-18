-- CreateTable
CREATE TABLE "DinoName" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "type" TEXT,
    "size" TEXT,
    "style" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "submittedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DinoStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "totalUses" INTEGER NOT NULL DEFAULT 0,
    "totalRerolls" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DinoName_name_key" ON "DinoName"("name");
