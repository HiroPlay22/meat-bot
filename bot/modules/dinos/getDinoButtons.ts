import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export function getDinoButtons(rerollId: string, settingsId: string) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(rerollId)
        .setLabel('🎲 Nochmal würfeln')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(settingsId)
        .setLabel('⚙️ Einstellungen ändern')
        .setStyle(ButtonStyle.Secondary)
    )
  ]
}