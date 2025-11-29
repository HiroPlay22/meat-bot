-- CreateTable
CREATE TABLE "CommandStatsGuildDaily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guildId" VARCHAR(32) NOT NULL,
    "commandName" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommandStatsGuildDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommandStatsGuildDaily_date_guildId_commandName_key" ON "CommandStatsGuildDaily"("date", "guildId", "commandName");
