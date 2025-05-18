-- CreateTable
CREATE TABLE "GlobalStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalGuilds" INTEGER NOT NULL DEFAULT 0,
    "lastBotOnline" DATETIME,
    "dbSizeMB" REAL NOT NULL DEFAULT 0,
    "totalDinoSuggestions" INTEGER NOT NULL DEFAULT 0,
    "totalDinoApproved" INTEGER NOT NULL DEFAULT 0,
    "totalFeedbacks" INTEGER NOT NULL DEFAULT 0,
    "totalVotingsStarted" INTEGER NOT NULL DEFAULT 0,
    "totalVotesCast" INTEGER NOT NULL DEFAULT 0,
    "totalGamesInDB" INTEGER NOT NULL DEFAULT 0,
    "totalFungamesViews" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "GuildStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dinoSuggestions" INTEGER NOT NULL DEFAULT 0,
    "dinoApproved" INTEGER NOT NULL DEFAULT 0,
    "feedbacks" INTEGER NOT NULL DEFAULT 0,
    "votingsStarted" INTEGER NOT NULL DEFAULT 0,
    "votesCast" INTEGER NOT NULL DEFAULT 0,
    "gamesInDB" INTEGER NOT NULL DEFAULT 0,
    "fungamesViews" INTEGER NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "memberOnline" INTEGER NOT NULL DEFAULT 0,
    "textChannelCount" INTEGER NOT NULL DEFAULT 0,
    "voiceChannelCount" INTEGER NOT NULL DEFAULT 0,
    "roleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME,
    "newMembers24h" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "VotingStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "votingType" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "votesCast" INTEGER NOT NULL DEFAULT 0,
    "guildId" TEXT
);

-- CreateTable
CREATE TABLE "FeedbackStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guildId" TEXT,
    "submittedBy" TEXT
);
