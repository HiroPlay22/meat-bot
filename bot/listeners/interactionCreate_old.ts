import {
  Events,
  Interaction,
  ModalSubmitInteraction,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { prisma } from "@database/client.js";
import { handleFeedbackModal } from "@modules/feedback/handleModal.js";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  console.log('⚡ interactionCreate fired');

  // --- 📦 Modal Submit (Feedback Modal)
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "feedback_modal") {
      console.log('✅ Feedback-Modal erkannt');
      await handleFeedbackModal(interaction as ModalSubmitInteraction);
      return;
    }
  }

  // --- 📦 Button Interactions
  if (interaction.isButton()) {
    console.log('🔘 Button erkannt:', interaction.customId);

    // Feedback Button (öffnet Modal)
    if (interaction.customId === "open_feedback_modal") {
      console.log('📨 Feedback-Modal öffnen');

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

    // --- 📦 Montagsspiel-Voting Button (Toggle + Vote-Zähler)
    if (interaction.customId.startsWith("vote_montag_")) {
      console.log('🗳️ Montagsspiel-Voting Button erkannt:', interaction.customId);
    
      const gameId = interaction.customId.replace("vote_montag_", "");
      const userId = interaction.user.id;
    
      try {
        // Stimme togglen
        const existingVote = await prisma.vote.findFirst({
          where: { userId, gameId }
        });
    
        if (existingVote) {
          await prisma.vote.delete({ where: { id: existingVote.id } });
          console.log(`❎ Stimme entfernt für User ${userId} bei Game ${gameId}`);
        } else {
          await prisma.vote.create({ data: { userId, gameId } });
          console.log(`✅ Stimme gespeichert für User ${userId} bei Game ${gameId}`);
        }
    
        // Aktive Stimmen dieses Users
        const userVotes = await prisma.vote.findMany({
          where: { userId },
          select: { gameId: true }
        });
        const activeGameIds = new Set(userVotes.map(v => v.gameId));
    
        // Alle Stimmen für alle Spiele
        const allVotes = await prisma.vote.findMany({ select: { gameId: true } });
        const voteMap = new Map<string, number>();
        for (const vote of allVotes) {
          voteMap.set(vote.gameId, (voteMap.get(vote.gameId) || 0) + 1);
        }
    
        // 🧠 Hole alle Spielnamen einmal aus der DB
        const allGames = await prisma.funGame.findMany({ select: { id: true, name: true } });
        const gameNameMap = new Map(allGames.map(g => [g.id, g.name]));
    
        // 🔄 Buttons neu aufbauen mit Stimmenzahl
        const updatedComponents = interaction.message.components.map(row => {
          const newRow = new ActionRowBuilder<ButtonBuilder>();
    
          for (const component of row.components) {
            if (component.type !== 2) continue;
    
            const customId = component.customId;
            if (!customId?.startsWith("vote_montag_")) continue;
    
            const buttonGameId = customId.replace("vote_montag_", "");
            const isActive = activeGameIds.has(buttonGameId);
            const voteCount = voteMap.get(buttonGameId) || 0;
            const gameName = gameNameMap.get(buttonGameId) || "Spiel";
    
            const newButton = ButtonBuilder.from(component)
              .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Primary)
              .setLabel(`${gameName} (${voteCount})`);
    
            newRow.addComponents(newButton);
          }
    
          return newRow;
        });
    
        await interaction.update({
          components: updatedComponents
        });
    
      } catch (error) {
        console.error('❌ Fehler beim Abstimmen:', error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Fehler beim Abstimmen.', ephemeral: true });
        }
      }
    
      return;
    }
    
  }
}
