-- CreateTable
CREATE TABLE "UserActivityDaily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guildId" VARCHAR(32),
    "userId" VARCHAR(32),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "voiceSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserActivityDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserActivityDaily_date_guildId_userId_key" ON "UserActivityDaily"("date", "guildId", "userId");
