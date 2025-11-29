-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('NONE', 'ALLOWED', 'DENIED');

-- CreateTable
CREATE TABLE "UserTrackingConsent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guildId" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(32) NOT NULL,
    "status" "TrackingStatus" NOT NULL,
    "version" VARCHAR(32),

    CONSTRAINT "UserTrackingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTrackingConsent_guildId_userId_key" ON "UserTrackingConsent"("guildId", "userId");
