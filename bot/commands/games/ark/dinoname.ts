import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('dinoname')
  .setDescription('Namen generieren')

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('🧬 ARKitekt – Dino-Setup')
    .setDescription('Wähle Eigenschaften für deinen Dino und drücke 🎲 Würfeln.')
    .setColor(0x2f3136)

  const colorSelect = new StringSelectMenuBuilder()
    .setCustomId('dino_color_select')
    .setPlaceholder('🎨 Farbe wählen')
    .addOptions(
      { label: 'Rot', value: 'rot', emoji: '🔴' },
      { label: 'Grün', value: 'gruen', emoji: '🟢' },
      { label: 'Blau', value: 'blau', emoji: '🔵' },
      { label: 'Gelb', value: 'gelb', emoji: '🟡' },
      { label: 'Orange', value: 'orange', emoji: '🟠' },
      { label: 'Lila', value: 'lila', emoji: '🟣' },
      { label: 'Braun', value: 'braun', emoji: '🟤' },
      { label: 'Pink', value: 'pink', emoji: '🩷' },
      { label: 'Schwarz', value: 'schwarz', emoji: '⚫' },
      { label: 'Weiß', value: 'weiss', emoji: '⚪' }
    )

  const typeSelect = new StringSelectMenuBuilder()
    .setCustomId('dino_type_select')
    .setPlaceholder('🧬 Art wählen')
    .addOptions(
      { label: 'Fleischfresser', value: 'fleischfresser', emoji: '🍖' },
      { label: 'Vegetarier', value: 'vegetarier', emoji: '🌿' }
    )

  const sizeSelect = new StringSelectMenuBuilder()
    .setCustomId('dino_size_select')
    .setPlaceholder('📏 Größe wählen')
    .addOptions(
      { label: 'Klein', value: 'klein' },
      { label: 'Mittel', value: 'mittel' },
      { label: 'Groß', value: 'gross' }
    )

  const styleSelect = new StringSelectMenuBuilder()
    .setCustomId('dino_style_select')
    .setPlaceholder('🧠 Eigenschaft wählen')
    .addOptions(
      { label: 'süß', value: 'suess' },
      { label: 'gefährlich', value: 'gefaehrlich' },
      { label: 'trashig', value: 'trashig' },
      { label: 'nobel', value: 'nobel' },
      { label: 'nerdig', value: 'nerdig' },
      { label: 'RTL', value: 'rtl' }
    )

  const rerollButton = new ButtonBuilder()
    .setCustomId('dinoname_generate')
    .setLabel('🎲 Würfeln')
    .setStyle(ButtonStyle.Primary)

  await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(colorSelect),
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(typeSelect),
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(sizeSelect),
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(styleSelect),
      new ActionRowBuilder<ButtonBuilder>().addComponents(rerollButton)
    ]
  })
}