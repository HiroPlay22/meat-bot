import { StringSelectMenuInteraction } from 'discord.js'

type DinoSettings = {
  color?: string
  type?: string
  size?: string
  style?: string
}

const userSelections = new Map<string, DinoSettings>()

export function getUserDinoSettings(userId: string): DinoSettings | undefined {
  return userSelections.get(userId)
}

export async function handleDinoSelect(interaction: StringSelectMenuInteraction) {
  const userId = interaction.user.id
  const current = userSelections.get(userId) || {}

  // Mapping je nach Custom ID
  const key = (() => {
    if (interaction.customId === 'dino_color_select') return 'color'
    if (interaction.customId === 'dino_type_select') return 'type'
    if (interaction.customId === 'dino_size_select') return 'size'
    if (interaction.customId === 'dino_style_select') return 'style'
    return null
  })()

  if (!key) return await interaction.deferUpdate().catch(() => {})

  const value = interaction.values[0]
  const updated = { ...current, [key]: value }

  userSelections.set(userId, updated)
  await interaction.deferUpdate().catch(() => {})
}