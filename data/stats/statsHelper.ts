import { prisma } from '../../database/client'

/**
 * Erhöht ein einzelnes Feld in den GlobalStats (z. B. totalVotesCast)
 */
export async function incrementGlobalStat(
  field: keyof Omit<Awaited<ReturnType<typeof prisma.globalStats.create>>['data'], 'id' | 'timestamp' | 'lastBotOnline' | 'dbSizeMB'>
) {
  const latest = await prisma.globalStats.findFirst({ orderBy: { timestamp: 'desc' } })
  if (!latest) {
    await prisma.globalStats.create({ data: { [field]: 1 } as any })
  } else {
    await prisma.globalStats.update({
      where: { id: latest.id },
      data: { [field]: { increment: 1 } } as any
    })
  }
}

/**
 * Erhöht ein einzelnes Feld in den GuildStats für eine bestimmte Guild
 */
export async function incrementGuildStat(
  guildId: string,
  field: keyof Omit<Awaited<ReturnType<typeof prisma.guildStats.create>>['data'], 'id' | 'timestamp' | 'guildId' | 'createdAt'>
) {
  const latest = await prisma.guildStats.findFirst({
    where: { guildId },
    orderBy: { timestamp: 'desc' }
  })
  if (!latest) {
    await prisma.guildStats.create({ data: { guildId, [field]: 1 } as any })
  } else {
    await prisma.guildStats.update({
      where: { id: latest.id },
      data: { [field]: { increment: 1 } } as any
    })
  }
}

/**
 * Erstellt neuen Snapshot-Eintrag für GuildStats (z. B. täglich)
 */
export async function createGuildSnapshot(guildId: string, snapshotData: Partial<{
  memberCount: number
  memberOnline: number
  textChannelCount: number
  voiceChannelCount: number
  roleCount: number
  createdAt: Date
  newMembers24h: number
}>) {
  await prisma.guildStats.create({
    data: {
      guildId,
      ...snapshotData
    }
  })
}

/**
 * Protokolliert den Start eines Votings
 */
export async function logVotingStart(type: string, guildId?: string) {
  await prisma.votingStats.create({
    data: {
      votingType: type,
      startedAt: new Date(),
      guildId
    }
  })
  await incrementGlobalStat('totalVotingsStarted')
  if (guildId) await incrementGuildStat(guildId, 'votingsStarted')
}

/**
 * Protokolliert die Abgabe einer Stimme
 */
export async function logVoteCast(guildId?: string) {
  const latest = await prisma.votingStats.findFirst({ orderBy: { startedAt: 'desc' } })
  if (latest) {
    await prisma.votingStats.update({
      where: { id: latest.id },
      data: { votesCast: { increment: 1 } }
    })
  }
  await incrementGlobalStat('totalVotesCast')
  if (guildId) await incrementGuildStat(guildId, 'votesCast')
}

/**
 * Protokolliert eine neue Feedback-Einreichung
 */
export async function logFeedback(guildId?: string, submittedBy?: string) {
  await prisma.feedbackStats.create({ data: { guildId, submittedBy } })
  await incrementGlobalStat('totalFeedbacks')
  if (guildId) await incrementGuildStat(guildId, 'feedbacks')
}
