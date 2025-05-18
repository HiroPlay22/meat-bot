import { Client, GatewayIntentBits } from 'discord.js'
import { prisma } from '../database/client'
import 'dotenv/config'

console.log('🧪 Starte Snapshot-Script...')
console.log('📁 Token geladen:', process.env.DISCORD_TOKEN ? '[OK]' : '[FEHLT]')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages
  ]
})

client.on('ready', async () => {
  console.log(`🔐 Eingeloggt als ${client.user?.tag}`)

  try {
    const fetchedGuilds = await client.guilds.fetch()
    const allGuildIds = fetchedGuilds.map(g => g.id)

    console.log(`📡 Starte Snapshot für ${allGuildIds.length} Server...`)

    for (const guildId of allGuildIds) {
      const guild = await client.guilds.fetch(guildId).catch(() => null)
      if (!guild) {
        console.warn(`⚠️ Guild ${guildId} konnte nicht geladen werden.`)
        continue
      }

      await guild.members.fetch()

      const memberCount = guild.memberCount
      const members = guild.members.cache
      const memberOnline = members.filter(m =>
        ['online', 'idle', 'dnd'].includes(m.presence?.status || '')
      ).size

      const textChannels = guild.channels.cache.filter(c => c.type === 0).size
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size
      const roleCount = guild.roles.cache.size
      const createdAt = guild.createdAt

      await prisma.guildStats.create({
        data: {
          guildId,
          memberCount,
          memberOnline,
          textChannelCount: textChannels,
          voiceChannelCount: voiceChannels,
          roleCount,
          createdAt,
          newMembers24h: 0
        }
      })

      console.log(`✅ Snapshot gespeichert für ${guild.name} (${guildId})`)
    }

    const totalGuilds = allGuildIds.length
    const totalDinoSuggestions = await prisma.dinoName.count()
    const totalDinoApproved = await prisma.dinoName.count({ where: { approved: true } })
    const totalGamesInDB = await prisma.funGame.count()
    const totalFeedbacks = await prisma.feedbackStats.count()
    const totalVotingsStarted = await prisma.votingStats.count()
    const totalVotesCast = await prisma.votingStats.aggregate({
      _sum: { votesCast: true }
    })

    await prisma.globalStats.create({
      data: {
        totalGuilds,
        totalDinoSuggestions,
        totalDinoApproved,
        totalGamesInDB,
        totalFeedbacks,
        totalVotingsStarted,
        totalVotesCast: totalVotesCast._sum.votesCast || 0,
        dbSizeMB: 0
      }
    })

    console.log('🌍 GlobalStats Snapshot gespeichert.')
    console.log('✅ Daily snapshot abgeschlossen.')

    client.destroy()
    process.exit(0)
  } catch (err) {
    console.error('❌ Fehler im Snapshot:', err)
    process.exit(1)
  }
})

client.on('error', (e) => console.error('❌ Discord-Client-Fehler:', e))
client.on('shardError', (e) => console.error('❌ Shard-Fehler:', e))

client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log('🟢 login() erfolgreich ausgeführt')
}).catch((err) => {
  console.error('❌ Login fehlgeschlagen:', err)
  process.exit(1)
})
