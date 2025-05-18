// interactions/buttons/statsHandler.ts
import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} from 'discord.js'
import { prisma } from '@database/client.js'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { emoji, safe } from '@utils/meatEmojis'

const COLOR = {
  server: 0x5865f2,
  global: 0x00bfff,
  votes: 0x43b581,
  feedback: 0xfaa61a,
  core: 0x9b59b6
}

function f(n: number): string {
  return new Intl.NumberFormat('de-DE').format(n)
}

export async function handleStatsButton(interaction: ButtonInteraction, view: string) {
  const userId = interaction.user.id
  const guildId = interaction.guildId || ''
  const botAvatar = interaction.client.user.displayAvatarURL()

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`stats_server_${userId}`).setLabel('🏠 Server Stats').setStyle(ButtonStyle.Secondary).setDisabled(view === 'server'),
    new ButtonBuilder().setCustomId(`stats_global_${userId}`).setLabel('🌍 Global Stats').setStyle(ButtonStyle.Secondary).setDisabled(view === 'global'),
    new ButtonBuilder().setCustomId(`stats_core_${userId}`).setLabel('🧠 M.E.A.T. Core').setStyle(ButtonStyle.Secondary).setDisabled(view === 'core')
  )

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`stats_feedback_${userId}`).setLabel('📬 Feedback Stats').setStyle(ButtonStyle.Secondary).setDisabled(view === 'feedback'),
    new ButtonBuilder().setCustomId(`stats_votes_${userId}`).setLabel('🗳️ Voting Stats').setStyle(ButtonStyle.Secondary).setDisabled(view === 'votes'),
    new ButtonBuilder().setCustomId(`stats_user_${userId}`).setLabel('👤 Deine Stats').setStyle(ButtonStyle.Success)
  )

  let embed: EmbedBuilder | undefined

  switch (view) {
    case 'server': {
      const guildStats = await prisma.guildStats.findFirst({ where: { guildId }, orderBy: { timestamp: 'desc' } })
      const guildMeta = interaction.guild

      if (!guildStats || !guildMeta) break

      const guildName = guildMeta.name
      const guildIcon = guildMeta.iconURL({ size: 256, extension: 'png' }) || null
      const createdAt = format(guildMeta.createdAt, 'dd.MM.yyyy', { locale: de })
      const categories = guildMeta.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size
      const threads = guildMeta.channels.cache.filter(c =>
        [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread, ChannelType.GuildForum].includes(c.type)
      ).size
      const emojis = guildMeta.emojis.cache.size
      const stickers = guildMeta.stickers.cache.size
      const boosts = guildMeta.premiumSubscriptionCount ?? 0
      const boostLevel = guildMeta.premiumTier

      embed = new EmbedBuilder()
        .setTitle(`Server Stats: M.E.A.T. **x** ${guildName}`)
        .setDescription('> Willkommen im Inneren deines Servers. M.E.A.T. weiß, was du letzten Sommer geboostet hast!')
        .setThumbnail(guildIcon)
        .setColor(COLOR.server)
        .addFields(
          {
            name: 'Allgemein',
            value: [
              `${safe(emoji.meat_calendar)} Erstellt am \`${createdAt}\``,
              `${safe(emoji.meat_users)} Mitglieder \`${f(guildStats.memberCount ?? 0)}\``,
              `${safe(emoji.meat_online)} Online \`${f(guildStats.memberOnline ?? 0)}\``,
              `${safe(emoji.meat_text)} Textkanäle \`${f(guildStats.textChannelCount ?? 0)}\``,
              `${safe(emoji.meat_voice)} Sprachkanäle \`${f(guildStats.voiceChannelCount ?? 0)}\``,
              `${safe(emoji.meat_roles)} Rollen \`${f(guildStats.roleCount ?? 0)}\``
            ].join('\n'),
            inline: true
          },
          {
            name: 'Technik & Boosts',
            value: [
              `${safe(emoji.meat_boosts)} Boosts \`${f(boosts)}\``,
              `${safe(emoji.meat_boostlevel)} Boost-Stufe \`${boostLevel}\``,
              `${safe(emoji.meat_categories)} Kategorien \`${f(categories)}\``,
              `${safe(emoji.meat_threads)} Threads/Foren \`${f(threads)}\``,
              `${safe(emoji.meat_emojis)} Emojis \`${f(emojis)}\``,
              `${safe(emoji.meat_sticker)} Sticker \`${f(stickers)}\``
            ].join('\n'),
            inline: true
          }
        )
        .setFooter({ text: `Letztes Update: ${format(guildStats.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}` })
      break
    }

    case 'global': {
      const global = await prisma.globalStats.findFirst({ orderBy: { timestamp: 'desc' } })
      if (!global) break

      embed = new EmbedBuilder()
        .setTitle('Global Stats')
        .setDescription('> Systemweite Datenernte abgeschlossen. Vertrauen ist optional – Protokolle nicht.')
        .setThumbnail(botAvatar)
        .setColor(COLOR.global)
        .addFields(
          {
            name: 'Nutzung & Aktivität',
            value: [
              `${safe(emoji.meat_servers)} Server \`${f(global.totalGuilds ?? 0)}\``,
              `${safe(emoji.meat_dinos)} DinoName-Vorschläge \`${f(global.totalDinoSuggestions ?? 0)}\``,
              `${safe(emoji.meat_approved)} Genehmigt \`${f(global.totalDinoApproved ?? 0)}\``,
              `${safe(emoji.meat_feedback)} Feedback gesendet \`${f(global.totalFeedbacks ?? 0)}\``,
              `${safe(emoji.meat_votings)} Votings gestartet \`${f(global.totalVotingsStarted ?? 0)}\``
            ].join('\n'),
            inline: true
          },
          {
            name: 'Weitere Kennzahlen',
            value: [
              `${safe(emoji.meat_votes)} Stimmen \`${f(global.totalVotesCast ?? 0)}\``,
              `${safe(emoji.meat_commands)} Spiele in FunGames-Liste \`${f(global.totalGamesInDB ?? 0)}\``,
              `${safe(emoji.meat_fungames)} Fungames-Liste aufgerufen \`${f(global.totalFungamesViews ?? 0)}\``,
              `${safe(emoji.meat_db)} DB-Größe \`${(global.dbSizeMB ?? 0).toFixed(2)} MB\``
            ].join('\n'),
            inline: true
          }
        )
        .setFooter({ text: `Letztes Update: ${format(global.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}` })
      break
    }

    case 'votes': {
      const count = await prisma.votingStats.count()
      const totalVotes = await prisma.votingStats.aggregate({ _sum: { votesCast: true } })

      embed = new EmbedBuilder()
        .setTitle('MEAT/VOTE-Terminal')
        .setDescription('> Systemcheck abgeschlossen. Wahlbeteiligung: enttäuschend. Nur wer mitstimmt, darf rebellieren.')
        .setColor(COLOR.votes)
        .addFields(
          {
            name: 'Abstimmungen',
            value: [
              `${safe(emoji.meat_votings)} Votings \`${f(count ?? 0)}\``,
              `${safe(emoji.meat_votes)} Stimmen \`${f(totalVotes._sum.votesCast ?? 0)}\``
            ].join('\n'),
            inline: true
          },
          {
            name: 'Systemerkenntnis',
            value: `Mehr Votings = mehr Community. <3`,
            inline: true
          }
        )
      break
    }

    case 'feedback': {
      const count = await prisma.feedbackStats.count()

      embed = new EmbedBuilder()
        .setTitle('Feedback Stats')
        .setDescription('> Statistische Auswertung eingereichter Meinungen. Ohne Wertung.')
        .setColor(COLOR.feedback)
        .addFields(
          {
            name: 'Übersicht',
            value: `${safe(emoji.meat_feedback)} Eingereicht \`${f(count ?? 0)}\``
          }
        )
      break
    }

    case 'core': {
      const [global, commands] = await Promise.all([
        prisma.globalStats.findFirst({ orderBy: { timestamp: 'desc' } }),
        interaction.client.application?.commands.fetch()
      ])

      const commandCount = commands?.size ?? 0
      const guildCount = global?.totalGuilds ?? 0

      embed = new EmbedBuilder()
        .setTitle(`${safe(emoji.meat_avatar)} M.E.A.T. Core Übersicht`)
        .setDescription('> Herz, Hirn und Hitzeentwicklung von M.E.A.T. in einem Embed – mit Plan, GitHub-Link und ein bisschen Größenwahn.')
        .setThumbnail(botAvatar)
        .setColor(COLOR.core)
        .addFields(
          {
            name: 'Info',
            value: [
              `${safe(emoji.meat_dev)} M.E.A.T. made by Hiro`,
              `${safe(emoji.meat_version)} CONSTRUCT-MEAT / v0.4.2`,
              `${safe(emoji.meat_servers)} Server \`${f(guildCount)}\``,
              `${safe(emoji.meat_commands)} Commands \`${f(commandCount)}\``
            ].join('\n'),
            inline: true
          },
          {
            name: 'Links',
            value: [
              `${safe(emoji.meat_website)} M.E.A.T HQ [meatbot.de](https://meatbot.de)`,
              `${safe(emoji.meat_github)} GitHub [Repo](https://github.com/HiroPlay22/meat-bot)`,
              `${safe(emoji.meat_discord)} Discord [Server](https://discord.gg/uZurfaWVPa)`
            ].join('\n'),
            inline: true
          }
        )
      break
    }
  }

  if (!embed || !embed.data?.fields?.length || embed.data.fields.some(f => !f.value)) {
    console.error('❌ Embed-Fehler: Ungültig oder leer:', embed?.data?.fields)
    return interaction.update({ content: '❌ Fehler beim Erstellen des Embeds.', components: [], embeds: [] })
  }

  await interaction.update({ embeds: [embed], components: [row1, row2] })
}
