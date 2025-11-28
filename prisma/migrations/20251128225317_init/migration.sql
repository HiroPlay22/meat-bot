-- CreateTable
CREATE TABLE "CommandUsage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guildId" VARCHAR(32),
    "channelId" VARCHAR(32),
    "userId" VARCHAR(32),
    "commandName" TEXT NOT NULL,

    CONSTRAINT "CommandUsage_pkey" PRIMARY KEY ("id")
);
