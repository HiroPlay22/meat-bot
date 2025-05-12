import {
  Client,
  Interaction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  MessageFlags
} from "discord.js";

import { loadSlashCommands } from "@loader/commandLoader";
import { logSystem } from "@services/internal/log";
import { interfaceHandler } from "./interfaceHandler.js";
import { handleFeedbackModal } from "@modules/feedback/handleModal.js";

/**
 * Registriert alle Discord-Interaktionen:
 * Slash-Commands, Buttons, Dropdowns, Modals etc.
 */
export async function registerInteractions(client: Client) {
  const commandMap = await loadSlashCommands();

  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      // Slash Commands
      if (interaction.isChatInputCommand()) {
        const handler = commandMap.get(interaction.commandName);
        if (!handler) {
          logSystem(`⚠️ Kein Handler für Slash-Command: ${interaction.commandName}`);
          return interaction.reply({ content: "Unbekannter Befehl.", flags: MessageFlags.Ephemeral });
        }
        await handler(interaction);
        return;
      }

      // Interface-Demo-Komponenten
      const wasHandled = await interfaceHandler(interaction);
      if (wasHandled) return;

      // Feedback Modal: SUBMIT
      if (interaction.isModalSubmit() && interaction.customId === "feedback_modal") {
        console.log("✅ handleFeedbackModal wird aufgerufen");
        await handleFeedbackModal(interaction as ModalSubmitInteraction);
        return;
      }

      // Feedback Button: MODAL öffnen
      if (interaction.isButton() && interaction.customId === "open_feedback_modal") {
        const modal = new ModalBuilder()
          .setCustomId("feedback_modal")
          .setTitle("Feedback-Protokoll")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("feedback_title")
                .setLabel("Kurztitel deines Feedbacks")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("feedback_description")
                .setLabel("Was möchtest du loswerden?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );

        await interaction.showModal(modal);
        return;
      }

      // Fallback nur für unbekannte Modals
      if (interaction.isModalSubmit()) {
        if (interaction.customId !== "feedback_modal") {
          logSystem(`📝 Modal abgeschickt (unbekannt): ${interaction.customId}`);
          await interaction.reply({
            content: `Danke für dein Formular: **${interaction.customId}**.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        return;
      }

    } catch (error) {
      console.error("❌ Fehler bei Interaktion:", error);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: "Es ist ein Fehler aufgetreten.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  logSystem("✅ Interaktionen registriert.");
}
