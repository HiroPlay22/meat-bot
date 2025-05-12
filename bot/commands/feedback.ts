import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { prisma } from "@database/client.js";
import { createStandardEmbed } from "@utils/style/createStandardEmbed";
import { incrementUsage } from "@services/internal/commandStat.service";

export const data = new SlashCommandBuilder()
  .setName("feedback")
  .setDescription("M.E.A.T. empfängt deine Worte, Rebell.");

export async function execute(interaction: ChatInputCommandInteraction) {
  const usageCount = await incrementUsage("feedback");

  // Holen der Feedback-Zählung
  const feedbackCount = await prisma.feedback.count();
  const protocolNo = feedbackCount + 1;

  // Sicherstellen, dass die Protokollnummer gültig ist und korrekt formatiert
  const protocolNoFormatted = protocolNo.toString().padStart(4, "0");

  const embed = createStandardEmbed({
    module: "feedback",
    moduleName: "M.E.A.T. empfängt deine Worte, Rebell.",
    user: interaction.user,
    title: `Feedback-Protokoll #${protocolNoFormatted} erstellen:`,
    bodyText:
      "Kritik? Ideen? Alles ist willkommen! Mach’s offiziell & schick dein Feedback direkt zu den Mods/Admins.",
    latency: interaction.client.ws.ping,
    usageCount,
    botPersona: "M.E.A.T.",
  });

  const button = new ButtonBuilder()
    .setCustomId("open_feedback_modal")
    .setLabel("✉ Feedback geben")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.reply({ 
    embeds: [embed],
    components: [row],
    ephemeral: false, // Jetzt für alle sichtbar
    allowedMentions: { repliedUser: false },
  });
}
