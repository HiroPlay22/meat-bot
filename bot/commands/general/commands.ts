// commands/general/commands.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { getCommandList } from '@/utils/registry/getCommandList.js';
import { emoji, safe } from '@utils/meatEmojis';

export const data = new SlashCommandBuilder()
  .setName('commands')
  .setDescription('Alle Befehle');

export async function execute(interaction: ChatInputCommandInteraction) {
  const icon = safe(emoji.meat_commands);
  const commandMap = await getCommandList();

  const allCommands = Object.values(commandMap).flat();
  const sorted = allCommands.sort((a, b) => a.name.localeCompare(b.name));

  const half = Math.ceil(sorted.length / 2);
  const left = sorted.slice(0, half);
  const right = sorted.slice(half);

  const format = (cmdList) =>
    cmdList
      .map(
        (cmd) =>
          `${icon} \`/${cmd.name}\` – ${cmd.description || 'Keine Beschreibung'}`
      )
      .join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`M.E.A.T./Commands (${sorted.length})`)
    .addFields([
      {
        name: ' ',
        value: format(left) || '\u200b',
        inline: true,
      },
      {
        name: ' ',
        value: format(right) || '\u200b',
        inline: true,
      },
    ])
    .setColor(0x8b0000);

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('❌ /commands FEHLER:', error);
    if (!interaction.replied) {
      await interaction.reply({
        content: 'Fehler beim Anzeigen der Befehle.',
        flags: 64,
      });
    }
  }
}
