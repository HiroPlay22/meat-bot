// interactions/buttons/statsHandler.ts
import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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

  if (view === 'user') {
    return interaction.reply({
      content: '👤 **Deine Stats** (persönlich)\n\n*Diese Funktion ist bald verfügbar.*',
      ephemeral: true
    })
  }

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`stats_server_${userId}`)
      .setLabel('🏠 Server Stats')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(view === 'server'),
    new ButtonBuilder()
      .setCustomId(`stats_global_${userId}`)
      .setLabel('🌍 Global Stats')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(view === 'global'),
    new ButtonBuilder()
      .setCustomId(`stats_votes_${userId}`)
      .setLabel('🗳️ Voting Stats')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(view === 'votes')
  )

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`stats_feedback_${userId}`)
      .setLabel('📬 Feedback Stats')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(view === 'feedback'),
    new ButtonBuilder()
      .setCustomId(`stats_core_${userId}`)
      .setLabel('🧠 M.E.A.T. Core')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(view === 'core'),
    new ButtonBuilder()
      .setCustomId(`stats_user_${userId}`)
      .setLabel('👤 Deine Stats')
      .setStyle(ButtonStyle.Success)
  )

  let embed: EmbedBuilder | undefined = undefined

  switch (view) {
    case 'server': {
      const guild = await prisma.guildStats.findFirst({
        where: { guildId },
        orderBy: { timestamp: 'desc' }
      })
      if (!guild) break

      embed = new EmbedBuilder()
        .setTitle('📊 M.E.A.T. Serverübersicht')
        .setColor(COLOR.server)
        .addFields(
          {
            name: 'Allgemein',
            value: [
              `${safe(emoji.meat_members)} Mitglieder: \`${f(guild.memberCount ?? 0)}\``,
              `${safe(emoji.meat_online)} Online: \`${f(guild.memberOnline ?? 0)}\``,
              `${safe(emoji.meat_text)} Textkanäle: \`${f(guild.textChannelCount ?? 0)}\``,
              `${safe(emoji.meat_voice)} Sprachkanäle: \`${f(guild.voiceChannelCount ?? 0)}\``,
              `${safe(emoji.meat_roles)} Rollen: \`${f(guild.roleCount ?? 0)}\``
            ].join('\n'),
            inline: true
          },
          {
            name: 'Aktivität',
            value: [
              `${safe(emoji.meat_dinos)} Dino-Vorschläge: \`${f(guild.dinoSuggestions ?? 0)}\``,
              `${safe(emoji.meat_approved)} Genehmigte Namen: \`${f(guild.dinoApproved ?? 0)}\``,
              `${safe(emoji.meat_feedback)} Feedbacks: \`${f(guild.feedbacks ?? 0)}\``,
              `${safe(emoji.meat_votings)} Votings gestartet: \`${f(guild.votingsStarted ?? 0)}\``,
              `${safe(emoji.meat_votes)} Stimmen abgegeben: \`${f(guild.votesCast ?? 0)}\``,
              `${safe(emoji.meat_fungames)} Fungames-Ansichten: \`${f(guild.fungamesViews ?? 0)}\``
            ].join('\n'),
            inline: true
          }
        )
        .setFooter({
          text: `Letztes Update: ${format(guild.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}`
        })
      break
    }

    case 'global': {
      const global = await prisma.globalStats.findFirst({
        orderBy: { timestamp: 'desc' }
      })
      if (!global) break

      embed = new EmbedBuilder()
        .setTitle('🌍 Global Stats')
        .setColor(COLOR.global)
        .addFields([
          {
            name: 'Systemweite Nutzung',
            value: [
              `${safe(emoji.meat_servers)} Server: \`${f(global.totalGuilds ?? 0)}\``,
              `${safe(emoji.meat_dinos)} Dino-Vorschläge: \`${f(global.totalDinoSuggestions ?? 0)}\``,
              `${safe(emoji.meat_approved)} Genehmigte Namen: \`${f(global.totalDinoApproved ?? 0)}\``,
              `${safe(emoji.meat_feedback)} Feedbacks: \`${f(global.totalFeedbacks ?? 0)}\``,
              `${safe(emoji.meat_votings)} Votings gestartet: \`${f(global.totalVotingsStarted ?? 0)}\``,
              `${safe(emoji.meat_votes)} Stimmen abgegeben: \`${f(global.totalVotesCast ?? 0)}\``,
              `${safe(emoji.meat_commands)} Spiele in DB: \`${f(global.totalGamesInDB ?? 0)}\``,
              `${safe(emoji.meat_fungames)} Fungames-Ansichten: \`${f(global.totalFungamesViews ?? 0)}\``
            ].join('\n')
          }
        ])
        .setFooter({
          text: `Letztes Update: ${format(global.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}`
        })
      break
    }

    case 'votes': {
      const count = await prisma.votingStats.count()
      const totalVotes = await prisma.votingStats.aggregate({ _sum: { votesCast: true } })

      embed = new EmbedBuilder()
        .setTitle('🗳️ Voting Stats')
        .setColor(COLOR.votes)
        .addFields([
          {
            name: 'Abstimmungen',
            value: [
              `${safe(emoji.meat_votings)} Gestartet: \`${f(count ?? 0)}\``,
              `${safe(emoji.meat_votes)} Stimmen: \`${f(totalVotes._sum.votesCast ?? 0)}\``
            ].join('\n')
          }
        ])
      break
    }

    case 'feedback': {
      const count = await prisma.feedbackStats.count()

      embed = new EmbedBuilder()
        .setTitle('📬 Feedback Stats')
        .setColor(COLOR.feedback)
        .addFields([
          {
            name: 'Feedback',
            value: `${safe(emoji.meat_feedback)} Insgesamt: \`${f(count ?? 0)}\``
          }
        ])
      break
    }

    case 'core': {
      embed = new EmbedBuilder()
        .setTitle('🧠 M.E.A.T. Core Übersicht')
        .setColor(COLOR.core)
        .addFields([
          {
            name: 'Info:',
            value: [
              `${safe(emoji.meat_dev)} Entwickler: HiroPlay#0001`,
              `${safe(emoji.meat_website)} Web: [M.E.A.T HQ](https://meatbot.de)`,
              `${safe(emoji.meat_github)} GitHub: [meat-bot](https://github.com/HiroPlay22/meat-bot)`,
              `${safe(emoji.meat_discord)} Support: [discord/meatbot](https://discord.gg/uZurfaWVPa)`,
              `${safe(emoji.meat_avatar)} Avatar: made by Hiro w/ AI`
            ].join('\n'),
            inline: true
          },
          {
            name: 'Stats:',
            value: [
              `${safe(emoji.meat_servers)} Server: bald™️`,
              `${safe(emoji.meat_users)} User: bald™️`,
              `${safe(emoji.meat_channels)} Channels: bald™️`,
              `${safe(emoji.meat_commands)} Commands: bald™️`
            ].join('\n'),
            inline: true
          }
        ])
      break
    }
  }

  if (!embed || !embed.data?.fields?.length || embed.data.fields.some(f => !f.value)) {
    console.error('❌ Embed-Fehler: Ungültig oder leer:', embed?.data?.fields)
    return interaction.update({ content: '❌ Fehler beim Erstellen des Embeds.', components: [], embeds: [] })
  }

  await interaction.update({ embeds: [embed], components: [row1, row2] })
}
