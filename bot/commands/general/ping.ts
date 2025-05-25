import {
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from "discord.js";
import { createStandardEmbed } from "@utils/style/createStandardEmbed";
import { incrementUsage } from "@services/internal/commandStat.service";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Bot Reaktionszeit");

export async function execute(interaction: ChatInputCommandInteraction) {
  const latency = interaction.client.ws.ping;
  const usageCount = await incrementUsage("ping");

  const embed = createStandardEmbed({
    module: "general",
    moduleName: "ping",
    user: interaction.user,
    title: "Pong!",
    bodyText: `Antwortgeschwindigkeit: **${latency}**ms`,
    latency: latency,
    usageCount: usageCount,
    botPersona: "M.E.A.T."
  });

  await interaction.reply({
    embeds: [embed],
    allowedMentions: { repliedUser: false }
  });
}
