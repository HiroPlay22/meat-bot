import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  GuildMember
} from 'discord.js';
import { handleMemberJoin } from '@/modules/join/index.js';

export const data = new SlashCommandBuilder()
  .setName('test-join')
  .setDescription('Test-Serverbeitritt')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 1 << 6 }); // 64 = ephemeral

  // Type-Sicherheit: Stelle sicher, dass es ein echter GuildMember ist
  if (!interaction.member || !('user' in interaction.member)) {
    await interaction.editReply('❌ Dieser Command funktioniert nur in einem Server.');
    return;
  }

  try {
    await handleMemberJoin(interaction.member as GuildMember);
    await interaction.editReply('✅ Beitrittssimulation ausgeführt. Check Embed & DM!');
  } catch (err) {
    console.error('[MEAT] Fehler bei /test-join:', err);
    await interaction.editReply('❌ Fehler beim Simulieren des Joins.');
  }
}
