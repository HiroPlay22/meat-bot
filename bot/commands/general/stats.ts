import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} from 'discord.js'
import { prisma } from '@database/client.js'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { emoji, safe } from '@utils/meatEmojis'

const COLOR = {
  server: 0x5865f2
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
  const guildMeta = interaction.guild
  const guildName = guildMeta?.name || 'Unbekannter Server'
  const guildIcon = guildMeta?.iconURL({ size: 256, extension: 'png' }) || null

  const guild = await prisma.guildStats.findFirst({
    where: { guildId },
    orderBy: { timestamp: 'desc' }
  })

  if (!guild || !guildMeta) {
    return interaction.editReply('❌ Keine Serverstatistiken gefunden.')
  }

  // Zusätzliche Live-Daten von Discord selbst
  const createdAt = format(guildMeta.createdAt, 'dd.MM.yyyy', { locale: de })
  const categories = guildMeta.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size
  const threads = guildMeta.channels.cache.filter(c =>
    [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread, ChannelType.GuildForum].includes(c.type)
  ).size
  const emojis = guildMeta.emojis.cache.size
  const stickers = guildMeta.stickers.cache.size
  const boosts = guildMeta.premiumSubscriptionCount ?? 0
  const boostLevel = guildMeta.premiumTier

  const embed = new EmbedBuilder()
    .setTitle(`Server Stats: M.E.A.T. **x** ${guildName}`)
    .setDescription('> Willkommen im Inneren deines Servers. M.E.A.T. weiß, was du letzten Sommer geboostet hast!')
    .setColor(COLOR.server)
    .setThumbnail(guildIcon)
    .addFields(
      {
        name: 'Allgemein',
        value: [
          `${safe(emoji.meat_calendar)} Erstellt am \`${createdAt}\``,
          `${safe(emoji.meat_users)} Mitglieder \`${f(guild.memberCount ?? 0)}\``,
          `${safe(emoji.meat_online)} Online \`${f(guild.memberOnline ?? 0)}\``,
          `${safe(emoji.meat_text)} Textkanäle \`${f(guild.textChannelCount ?? 0)}\``,
          `${safe(emoji.meat_voice)} Sprachkanäle \`${f(guild.voiceChannelCount ?? 0)}\``,
          `${safe(emoji.meat_roles)} Rollen \`${f(guild.roleCount ?? 0)}\``
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
    .setFooter({
      text: `Letztes Update: ${format(guild.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}`
    })

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`stats_server_${userId}`).setLabel('🏠 Server Stats').setStyle(ButtonStyle.Primary).setDisabled(true),
    new ButtonBuilder().setCustomId(`stats_global_${userId}`).setLabel('🌍 Global Stats').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stats_core_${userId}`).setLabel('🧠 M.E.A.T. Core').setStyle(ButtonStyle.Secondary)
  )

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`stats_feedback_${userId}`).setLabel('📬 Feedback Stats').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stats_votes_${userId}`).setLabel('🗳️ Voting Stats').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stats_user_${userId}`).setLabel('👤 Deine Stats').setStyle(ButtonStyle.Success)
  )

  if (!embed.data.fields?.length || embed.data.fields.some(f => !f.value)) {
    console.error('❌ Embed-Fehler: Leeres oder ungültiges Field:', embed.data.fields)
    return interaction.editReply({ content: '❌ Fehler beim Erstellen des Embeds.', components: [], embeds: [] })
  }

  await interaction.editReply({ embeds: [embed], components: [row1, row2] })
}
