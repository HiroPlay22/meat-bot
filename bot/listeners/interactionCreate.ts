import {
  Events,
  Interaction,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from "discord.js";

import { handleFeedbackModal } from "@modules/feedback/handleModal.js";
import { parseTraits, generateTraitsInline } from "@utils/parseTraits";
import { DinoColorHex } from "@utils/style/dinoColors";
import { getRandomDinoNames, getFavorites, addFavorite } from "@services/dinoService";
import { generateMultiRowButtons } from "@utils/components/generateMultiRowButtons";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  console.log("🎯 interactionCreate event received");

  // --- Modal Submit (Feedback) ---
  if (interaction.isModalSubmit()) {
    console.log("🧠 Modal erkannt:", interaction.customId);
    if (interaction.customId === "feedback_modal") {
      await handleFeedbackModal(interaction as ModalSubmitInteraction);
      return;
    }
  }

  // --- Button Interactions ---
  if (interaction.isButton()) {
    console.log("🔘 Button erkannt:", interaction.customId);

    if (interaction.customId === "open_feedback_modal") {
      console.log("📨 Feedback-Modal wird geöffnet");

      const modal = new ModalBuilder()
        .setCustomId("feedback_modal")
        .setTitle("Feedback-Protokoll 📡")
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

    // --- Button: Favorit speichern (⭐)
    if (interaction.customId.startsWith("fav_")) {
      const name = interaction.customId.replace("fav_", "");
      console.log(`⭐ Favoriten-Button gedrückt: ${name}`);

      await addFavorite(interaction.user.id, {
        name,
        dinoName: "T-Rex",
        style: "Trashig",
        color: "blau"
      });

      await interaction.reply({
        content: `⭐ **${name}** wurde zu deinen Favoriten hinzugefügt!`,
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    // --- Button: "Neu würfeln"
    if (interaction.customId === "roll_again") {
      console.log("🎲 Roll Again gedrückt");

      const randomNames = await getRandomDinoNames("T-Rex", "Trashig", "blau");

      if (randomNames.length === 0) {
        await interaction.reply({ content: "❌ Keine Dino-Namen gefunden.", flags: MessageFlags.Ephemeral });
        return;
      }

      const traits = ["episch", "trashig", "mutiert"];

      const embed = new EmbedBuilder()
        .setTitle("🧬 DNA-Profil: T-Rex")
        .setDescription(
          `Eigenschaften: ${generateTraitsInline(traits)}\n` +
          `Farbe: 🔵 \`blau\`\n\n` +
          "📋 Kandidaten für deinen Tribe:\n" +
          "➔ Siehe Buttons unten!\n\n" +
          "🎲 [ Neu würfeln ]\n\n" +
          "> \"Das Leben findet einen Weg.\" – Dr. Ian Malcolm\n" +
          "*... und wenn nicht, drück halt auf den Würfelknopf!!*\n\n"
        )
        .setColor(DinoColorHex["blau"])
        .setThumbnail("https://example.com/images/trex.png");

        const buttonRows = generateMultiRowButtons(
          randomNames.map((entry: { name: string }) => ({ name: entry.name }))
        );        

      await interaction.update({
        embeds: [embed],
        components: buttonRows
      });

      return;
    }

    // --- Button: "Favoriten senden"
    if (interaction.customId === "send_favorites") {
      console.log("📤 Favoriten an mich senden gedrückt");

      const favorites = await getFavorites(interaction.user.id);

      if (!favorites.length) {
        await interaction.reply({
          content: "❌ Du hast noch keine Favoriten gespeichert.",
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("📤 Deine favorisierten Dino-Namen")
        .setDescription(favorites.map((fav: { name: string, dinoName: string, style: string }) => `⭐ ${fav.name} (${fav.dinoName} - ${fav.style})`).join("\n"))
        .setColor(0x43b581);

      await interaction.user.send({ embeds: [embed] });

      await interaction.reply({
        content: "📬 Favoriten wurden dir per DM geschickt!",
        flags: MessageFlags.Ephemeral
      });

      return;
    }
  }

  // --- String Select Menus (Dropdowns) ---
  if (interaction.isStringSelectMenu()) {
    console.log("🎨 Dropdown erkannt:", interaction.customId);

    if (interaction.customId === "dino-style" || interaction.customId === "dino-color") {
      const selectedStyle = interaction.customId === "dino-style" ? interaction.values[0] : undefined;
      const selectedColor = interaction.customId === "dino-color" ? interaction.values[0] : undefined;

      const selectedDino = "T-Rex";
      const traitsString = "episch,trashig,süß";
      const traits = parseTraits(traitsString);
      const candidates = ["Rexonator", "Bytezilla", "Snaximus", "Chompzilla", "Clawnardo"];

      const embed = new EmbedBuilder()
        .setTitle(`🧬 DNA-Profil: ${selectedDino}`)
        .setDescription(
          `Eigenschaften: ${generateTraitsInline(traits)}\n` +
          `Farbe: ${selectedColor ? `🔵 \`${selectedColor}\`` : "Nicht ausgewählt"}\n\n` +
          "📋 Kandidaten für deinen Tribe:\n" +
          "➔ Siehe Buttons unten!\n\n" +
          "🎲 [ Neu würfeln ]\n\n" +
          "> \"Das Leben findet einen Weg.\" – Dr. Ian Malcolm\n" +
          "*... und wenn nicht, drück halt auf den Würfelknopf!!*\n\n"
        )
        .setColor(DinoColorHex[selectedColor ?? "blau"])
        .setThumbnail("https://example.com/images/trex.png");

      const buttonRows = generateMultiRowButtons(candidates.map((name) => ({ name })));

      await interaction.update({
        content: "",
        embeds: [embed],
        components: buttonRows
      });

      console.log("🦖 Dino-Embed erfolgreich aktualisiert");
    }
  }
}
