import {
  EmbedBuilder,
  TextChannel,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'
import { prisma } from '@database/client.js'
import serverSettings from '@config/serverSettings.json' with { type: 'json' }

type SubmitProps = {
  guildId: string
  member: GuildMember
  name: string
}

export async function submitSuggestion({ guildId, member, name }: SubmitProps): Promise<boolean> {
  const settings = serverSettings.guilds[guildId]
  const channelId = settings?.dinonameSuggestionChannelId
  const modCategoryId = settings?.modCategoryId

  if (!channelId || !modCategoryId) {
    console.warn(`❌ Kein Channel oder modCategoryId für ${guildId}`)
    return false
  }

  const cleanName = name.trim()
  if (!cleanName || cleanName.length < 2 || cleanName.length > 30) {
    console.warn(`⚠️ Ungültige Namenslänge: "${name}"`)
    return false
  }

  const normalized = cleanName.toLowerCase()
  const exists = await prisma.dinoName.findFirst({
    where: { name: normalized }
  })

  if (exists) {
    console.warn(`⚠️ Name "${name}" existiert bereits in der DB.`)
    return false
  }

  const channel = member.guild.channels.cache.get(channelId) as TextChannel
  if (!channel || !channel.isTextBased()) {
    console.warn('❌ Channel nicht gefunden oder nicht textbasiert.')
    return false
  }

  const embed = new EmbedBuilder()
    .setTitle('Namensvorschlag')
    .setDescription(`**${cleanName}**`)
    .addFields({ name: 'Vorgeschlagen von', value: `<@${member.id}>` })
    .setColor(0xffc107)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_dinoname_${cleanName}`)
      .setLabel('✅ Freigeben')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_dinoname_${cleanName}`)
      .setLabel('❌ Ablehnen')
      .setStyle(ButtonStyle.Danger)
  )

  await channel.send({ embeds: [embed], components: [row] })
  console.log(`📨 Vorschlag gesendet: ${cleanName} von ${member.displayName}`)

  return true
}
