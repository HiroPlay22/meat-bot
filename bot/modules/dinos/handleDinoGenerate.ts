import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder
} from 'discord.js'
import { getRandomDinoNames } from './getRandomDinoNames.js'
import { buildDinoEmbed } from './buildDinoEmbed.js'
import { getUserDinoSettings } from './handleDinoSelect.js'

export async function handleDinoGenerate(interaction: ButtonInteraction) {
  try {
    const rows = interaction.message.components as ActionRowBuilder<MessageActionRowComponentBuilder>[]

    const clean = (val?: string) => (val === 'none' ? undefined : val)

    const filters = {
      color: clean(getUserDinoSettings(interaction.user.id)?.color),
      type: clean(getUserDinoSettings(interaction.user.id)?.type),
      size: clean(getUserDinoSettings(interaction.user.id)?.size),
      style: clean(getUserDinoSettings(interaction.user.id)?.style)
    }

    const isFirstRoll = interaction.message.embeds.length === 0

    console.log('🧪 FILTERS:', filters)

    const names = await getRandomDinoNames(filters)
    const embed = buildDinoEmbed(names, filters, 0)

    const markSelected = (options: any[], selected?: string) =>
      options.map(opt => ({ ...opt, default: opt.value === selected }))

    const dropdown = (id: string, placeholder: string, options: any[]) =>
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(id)
          .setPlaceholder(placeholder)
          .addOptions([{ label: '— Keine Auswahl —', value: 'none' }, ...options])
      )

    const updatedComponents = [
      dropdown('dino_color_select', '🎨 Farbe wählen', markSelected([
        { label: '🔴 Rot', value: 'rot' },
        { label: '🟠 Orange', value: 'orange' },
        { label: '🟡 Gelb', value: 'gelb' },
        { label: '🟢 Grün', value: 'gruen' },
        { label: '🔵 Blau', value: 'blau' },
        { label: '🟣 Lila', value: 'lila' },
        { label: '🟤 Braun', value: 'braun' },
        { label: '🩷 Pink', value: 'pink' },
        { label: '⚫ Schwarz', value: 'schwarz' },
        { label: '⚪ Weiß', value: 'weiss' }
      ], filters.color)),
      dropdown('dino_type_select', '🧬 Art wählen', markSelected([
        { label: 'Fleischfresser', value: 'fleischfresser', emoji: '🍖' },
        { label: 'Vegetarier', value: 'vegetarier', emoji: '🌿' }
      ], filters.type)),
      dropdown('dino_size_select', '📏 Größe wählen', markSelected([
        { label: 'Klein', value: 'klein' },
        { label: 'Mittel', value: 'mittel' },
        { label: 'Groß', value: 'gross' }
      ], filters.size)),
      dropdown('dino_style_select', '🧠 Eigenschaft wählen', markSelected([
        { label: 'süß', value: 'suess' },
        { label: 'gefährlich', value: 'gefaehrlich' },
        { label: 'trashig', value: 'trashig' },
        { label: 'nobel', value: 'nobel' },
        { label: 'nerdig', value: 'nerdig' },
        { label: 'RTL', value: 'rtl' }
      ], filters.style)),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('dinoname_generate')
          .setLabel(isFirstRoll ? '🎲 Würfeln' : '🎲 Noch mal würfeln')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('dinoname_submit')
          .setLabel('🔤 Namen vorschlagen')
          .setStyle(ButtonStyle.Secondary)
      )
    ]

    await interaction.update({
      embeds: [embed],
      components: updatedComponents
    })
  } catch (err) {
    console.error('❌ Fehler beim Dino-Generieren:', err)
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Etwas ist schiefgelaufen beim Würfeln 🦖',
        ephemeral: true
      }).catch(() => {})
    }
  }
}
