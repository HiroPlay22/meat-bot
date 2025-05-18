// commands/general/stats.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js'
import { prisma } from '@database/client.js'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { emoji, safe } from '@utils/meatEmojis'

const COLOR = {
  server: 0x5865f2,
}

function f(n: number): string {
  return new Intl.NumberFormat('de-DE').format(n)
}

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Zeigt dir die aktuellen M.E.A.T.-Statistiken')

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  const userId = interaction.user.id
  const guildId = interaction.guildId || ''

  const guild = await prisma.guildStats.findFirst({
    where: { guildId },
    orderBy: { timestamp: 'desc' }
  })

  if (!guild) return interaction.editReply('❌ Keine Serverstatistiken gefunden.')

  const embed = new EmbedBuilder()
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
          `${safe(emoji.meat_votings)} Votings: \`${f(guild.votingsStarted ?? 0)}\``,
          `${safe(emoji.meat_votes)} Stimmen: \`${f(guild.votesCast ?? 0)}\``,
          `${safe(emoji.meat_fungames)} Fungames: \`${f(guild.fungamesViews ?? 0)}\``
        ].join('\n'),
        inline: true
      }
    )
    .setFooter({
      text: `Letztes Update: ${format(guild.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}`
    })

  // Buttons
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`stats_server_${userId}`)
      .setLabel('🏠 Server Stats')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`stats_global_${userId}`)
      .setLabel('🌍 Global Stats')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`stats_votes_${userId}`)
      .setLabel('🗳️ Voting Stats')
      .setStyle(ButtonStyle.Secondary)
  )

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`stats_feedback_${userId}`)
      .setLabel('📬 Feedback Stats')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`stats_core_${userId}`)
      .setLabel('🧠 M.E.A.T. Core')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`stats_user_${userId}`)
      .setLabel('👤 Deine Stats')
      .setStyle(ButtonStyle.Success)
  )

  // Sicherheitsprüfung für Embed-Felder
  if (!embed.data.fields?.length || embed.data.fields.some(f => !f.value)) {
    console.error('❌ Embed-Fehler: Leeres Field entdeckt:', embed.data.fields)
    return interaction.editReply({ content: '❌ Fehler beim Erstellen des Embeds.', components: [], embeds: [] })
  }

  await interaction.editReply({ embeds: [embed], components: [row1, row2] })
}
