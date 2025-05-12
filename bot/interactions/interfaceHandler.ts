// bot/interactions/interfaceHandler.ts
import {
  ButtonInteraction,
  ModalSubmitInteraction,
  SelectMenuInteraction,
  Interaction,
  MessageFlags
} from "discord.js";

/**
 * Reagiert auf Interface-Demo-Komponenten (Buttons, Dropdowns, Modals)
 */
export async function interfaceHandler(interaction: Interaction) {
  if (interaction.isButton()) {
    // Nur Demo-Buttons behandeln
    const allowedButtonIds = [
      "demo_primary",
      "demo_secondary",
      "demo_success",
      "demo_danger",
      "open_modal",
      "open_feedback_modal" // 👈 das ist neu
    ];
    if (!allowedButtonIds.includes(interaction.customId)) return;

    switch (interaction.customId) {
      case "demo_primary":
        return interaction.reply({ content: "🟦 Du hast den Primary-Button gedrückt.", flags: MessageFlags.Ephemeral });
      case "demo_secondary":
        return interaction.reply({ content: "🖤 Du hast den Secondary-Button gedrückt.", flags: MessageFlags.Ephemeral });
      case "demo_success":
        return interaction.reply({ content: "✅ Du hast den Success-Button gedrückt.", flags: MessageFlags.Ephemeral });
      case "demo_danger":
        return interaction.reply({ content: "❌ Du hast den Danger-Button gedrückt.", flags: MessageFlags.Ephemeral });
      case "open_modal":
        return interaction.showModal({
          customId: "demo_modal",
          title: "📝 Feedbackformular",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  customId: "input_name",
                  label: "Dein Name",
                  style: 1,
                  required: true,
                  placeholder: "Max Mustermann",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  customId: "input_feedback",
                  label: "Deine Nachricht",
                  style: 2,
                  required: false,
                  placeholder: "Ich liebe diesen Bot!",
                },
              ],
            },
          ],
        });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === "demo_modal") {
    const name = interaction.fields.getTextInputValue("input_name");
    const feedback = interaction.fields.getTextInputValue("input_feedback");

    return interaction.reply({
      content: `🧾 Danke für dein Feedback, **${name}**!\n\n📨 \`\`\`${feedback}\`\`\``,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "demo_dropdown") {
    return interaction.reply({
      content: `📋 Du hast gewählt: **${interaction.values.join(", ")}**`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
