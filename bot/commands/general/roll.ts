import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { buildRollEmbed } from "@/modules/roll/buildRollEmbed.js";
import { buildRollButtons } from "@/modules/roll/buildRollButtons.js";
import { setRollState } from "@/modules/roll/rollState.js";

export const data = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Würfle mit Stil – klassisch, DnD oder sogar im GM-Channel.");

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user;

  // Setze leeren Würfel-Status (default d6)
  setRollState(user.id, {
    type: "d6",
    count: 0,
    gmEnabled: false
  });

  const embed = buildRollEmbed({
    phase: "phase1",
    user
  });

  const components = buildRollButtons({
    phase: "phase1",
    viewer: user,
    owner: user
  });

  await interaction.reply({
    embeds: [embed],
    components
  });
}
