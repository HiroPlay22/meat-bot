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
    .setDescription("📡 M.E.A.T. empfängt deine Worte, Rebell. Mach’s offiziell – drop dein Feedback ins Archiv");
  
  export async function execute(interaction: ChatInputCommandInteraction) {
    const usageCount = await incrementUsage("feedback");
  
    const feedbackCount = await prisma.feedback.count();
    const protocolNo = feedbackCount + 1;
  
    const embed = createStandardEmbed({
      module: "feedback",
      moduleName: "Feedback-Protokoll",
      user: interaction.user,
      title: `Feedback-Protokoll #${protocolNo.toString().padStart(4, "0")}`,
      bodyText:
        "Willkommen im M.E.A.T.-Archiv.\n" +
        "Hier kannst du Lob, Bugs oder Ideen einreichen.\n" +
        "Nur Mut. Das System notiert alles. Vielleicht.",
      latency: interaction.client.ws.ping,
      usageCount,
      botPersona: "M.E.A.T.",
    });
  
    const button = new ButtonBuilder()
      .setCustomId("open_feedback_modal")
      .setLabel("📨 Feedback geben")
      .setStyle(ButtonStyle.Primary);
  
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false, // Jetzt für alle sichtbar
      allowedMentions: { repliedUser: false }
    });
  }
  