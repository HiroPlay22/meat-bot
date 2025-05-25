export interface StatsResult {
  version: string
  updatedAt: Date
  bot: {
    dbSizeMB: number
    totalGuilds: number
    lastOnline: Date | null
    avgPing: number
  }
  usage: {
    totalCommands: number
    topCommands: { command: string; count: number }[]
    totalVotesCast: number
    totalVotings: number
    totalFeedbacks: number
    totalEvents: number
  }
  dino: {
    totalSuggestions: number
    totalApproved: number
    uses: number
    rerolls: number
  }
  fungames: {
    totalGames: number
    totalViews: number
  }
}
