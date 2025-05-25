// api/stats/getAllStats.ts
import { prisma } from '../../database/client'
import type { Client } from 'discord.js'
import os from 'os'

export async function getAllStats(client: Client) {
  const [
    global,
    dino,
    commandStats,
    votesAgg,
    feedbackCount,
    eventCount
  ] = await Promise.all([
    prisma.globalStats.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.dinoStats.findFirst({ orderBy: { updatedAt: 'desc' } }),
    prisma.commandStat.findMany(),
    prisma.votingStats.aggregate({ _sum: { votesCast: true } }),
    prisma.feedback.count(),
    prisma.poll.count()
  ])

  // Ping (Live)
  const avgPing = Math.round(client.ws.ping)

  // RAM & CPU (Systemdaten)
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const heapUsed = process.memoryUsage().heapUsed
  const heapTotal = process.memoryUsage().heapTotal

  const cpuLoad = os.loadavg()[0] // 1-Min-Load
  const cpuCount = os.cpus().length
  const cpuUsagePercent = Math.min(100, Math.round((cpuLoad / cpuCount) * 100))

  // Command Count
  const totalCommandUses = commandStats.reduce((sum, c) => sum + c.count, 0)

  return {
    version: 'v0.004-CONSTRUCT',
    updatedAt: global?.timestamp ?? new Date(),

    bot: {
      dbSizeMB: global?.dbSizeMB ?? 0,
      totalGuilds: global?.totalGuilds ?? 0,
      lastOnline: global?.lastBotOnline ?? null,
      avgPing,
      system: {
        ram: {
          totalMB: Math.round(totalMem / 1024 / 1024),
          usedMB: Math.round(usedMem / 1024 / 1024),
          heapUsedMB: Math.round(heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(heapTotal / 1024 / 1024)
        },
        cpu: {
          cores: cpuCount,
          load1min: cpuLoad.toFixed(2),
          usagePercent: cpuUsagePercent
        }
      }
    },

    usage: {
      totalCommands: totalCommandUses,
      topCommands: commandStats
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(c => ({ command: c.command, count: c.count })),
      totalVotesCast: global?.totalVotesCast ?? votesAgg._sum.votesCast ?? 0,
      totalVotings: global?.totalVotingsStarted ?? 0,
      totalFeedbacks: global?.totalFeedbacks ?? feedbackCount ?? 0,
      totalEvents: eventCount
    },

    dino: {
      totalSuggestions: global?.totalDinoSuggestions ?? 0,
      totalApproved: global?.totalDinoApproved ?? 0,
      uses: dino?.totalUses ?? 0,
      rerolls: dino?.totalRerolls ?? 0
    },

    fungames: {
      totalGames: global?.totalGamesInDB ?? 0,
      totalViews: global?.totalFungamesViews ?? 0
    }
  }
}
