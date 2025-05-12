import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags
  } from "discord.js";
  
  export const data = new SlashCommandBuilder()
    .setName('dino-name')
    .setDescription('Würfle epische Dino-Namen für deinen Tribe!');
  
  export async function execute(interaction: ChatInputCommandInteraction) {
    const styleDropdown = new StringSelectMenuBuilder()
      .setCustomId('dino-style')
      .setPlaceholder('Wähle den Stil')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('Trashig').setValue('Trashig'),
        new StringSelectMenuOptionBuilder().setLabel('Mutiert').setValue('Mutiert'),
        new StringSelectMenuOptionBuilder().setLabel('Techno').setValue('Techno'),
        new StringSelectMenuOptionBuilder().setLabel('Edel').setValue('Edel')
      );
  
    const colorDropdown = new StringSelectMenuBuilder()
      .setCustomId('dino-color')
      .setPlaceholder('Wähle eine Farbe')
      .addOptions(
        { label: 'Rot', value: 'rot', emoji: '🔴' },
        { label: 'Orange', value: 'orange', emoji: '🟠' },
        { label: 'Gelb', value: 'gelb', emoji: '🟡' },
        { label: 'Grün', value: 'grün', emoji: '🟢' },
        { label: 'Blau', value: 'blau', emoji: '🔵' },
        { label: 'Violett', value: 'violett', emoji: '🟣' },
        { label: 'Grau', value: 'grau', emoji: '⚪' },
        { label: 'Schwarz', value: 'schwarz', emoji: '⚫' }
      );
  
    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(styleDropdown);
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(colorDropdown);
  
    await interaction.reply({
      content: "🧬 Wähle Stil und Farbe für deinen Dino-Namenswurf:",
      components: [row1, row2],
      flags: MessageFlags.Ephemeral
    });
  }
  