import {
  Client,
  Interaction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

import { loadSlashCommands } from "../loader/commandLoader.js";
import { logSystem } from "@services/internal/log";
import { prisma } from "@database/client.js";
import { handleFeedbackModal } from "@modules/feedback/handleModal.js";

export async function registerInteractions(client: Client) {
  const commandMap = await loadSlashCommands();

  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      console.log("⚡ interactionCreate fired");

      // === 1. Slash Commands ===
      if (interaction.isChatInputCommand()) {
        const handler = commandMap.get(interaction.commandName);
        if (!handler) {
          logSystem(`⚠️ Kein Handler für Slash-Command: ${interaction.commandName}`);
          return interaction.reply({ content: "Unbekannter Befehl.", ephemeral: true });
        }
        await handler(interaction as ChatInputCommandInteraction);
        return;
      }

      // === 2. Feedback Modal SUBMIT ===
      if (interaction.isModalSubmit() && interaction.customId === "feedback_modal") {
        console.log("🧠 Feedback-Modal SUBMIT erkannt");
        await handleFeedbackModal(interaction as ModalSubmitInteraction);
        return;
      }

      // === 3. Feedback Button: Modal anzeigen ===
      if (interaction.isButton() && interaction.customId === "open_feedback_modal") {
        console.log("📨 Feedback-Modal öffnen");

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

      // === 4. Voting Button (Montagsrunde) ===
      if (interaction.isButton() && interaction.customId.startsWith("vote_montag_")) {
        console.log("🗳️ Voting Button erkannt:", interaction.customId);

        const [_prefix, pollId, gameId] = interaction.customId.split("_");
        const userId = interaction.user.id;

        try {
          const poll = await prisma.poll.findUnique({ where: { id: pollId } });
          if (!poll || poll.endedAt !== null) {
            return interaction.reply({
              content: "❌ Dieses Voting ist nicht mehr aktiv.",
              ephemeral: true
            });
          }

          const existingVote = await prisma.vote.findFirst({
            where: { userId, gameId, pollId }
          });

          if (existingVote) {
            await prisma.vote.delete({ where: { id: existingVote.id } });
            console.log(`❎ Stimme entfernt für User ${userId} bei Game ${gameId}`);
          } else {
            await prisma.vote.create({
              data: { userId, gameId, pollId }
            });
            console.log(`✅ Stimme gespeichert für User ${userId} bei Game ${gameId}`);
          }

          const userVotes = await prisma.vote.findMany({
            where: { userId, pollId },
            select: { gameId: true }
          });
          const activeGameIds = new Set(userVotes.map(v => v.gameId));

          const allVotes = await prisma.vote.findMany({
            where: { pollId },
            select: { gameId: true }
          });
          const voteMap = new Map<string, number>();
          for (const vote of allVotes) {
            voteMap.set(vote.gameId, (voteMap.get(vote.gameId) || 0) + 1);
          }

          const allGames = await prisma.funGame.findMany({
            select: { id: true, name: true }
          });
          const gameNameMap = new Map(allGames.map(g => [g.id, g.name]));

          const updatedRows: ActionRowBuilder<ButtonBuilder>[] = [];
          let currentRow = new ActionRowBuilder<ButtonBuilder>();

          for (const row of interaction.message.components) {
            for (const component of row.components) {
              if (component.type !== 2) continue;

              const customId = component.customId;
              const [_prefix, btnPollId, btnGameId] = customId?.split("_") ?? [];
              if (btnPollId !== pollId) continue;

              const isActive = activeGameIds.has(btnGameId);
              const voteCount = voteMap.get(btnGameId) || 0;
              const gameName = gameNameMap.get(btnGameId) || "Spiel";

              const newButton = new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`${gameName} (${voteCount})`)
                .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Primary);

              currentRow.addComponents(newButton);
              if (currentRow.components.length === 4) {
                updatedRows.push(currentRow);
                currentRow = new ActionRowBuilder<ButtonBuilder>();
              }
            }
          }

          if (currentRow.components.length > 0) {
            updatedRows.push(currentRow);
          }

          await interaction.update({ components: updatedRows });
        } catch (error) {
          console.error("❌ Fehler beim Abstimmen:", error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "❌ Fehler beim Abstimmen.",
              ephemeral: true
            });
          }
        }

        return;
      }

      // === 5. Ergebnis-Button (Archiv) ===
      if (interaction.isButton() && interaction.customId.startsWith("view_poll_result_montag_")) {
        const pollId = interaction.customId.replace("view_poll_result_montag_", "");
        console.log("📊 Ergebnis-Button erkannt:", pollId);

        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll || !poll.endedAt || !poll.winnerId) {
          return interaction.reply({
            content: "❌ Protokoll beschädigt oder Voting noch aktiv.",
            ephemeral: true
          });
        }

        const votes = await prisma.vote.findMany({
          where: { pollId },
          include: { game: true }
        });

        const voteCounts: Record<string, { name: string, count: number }> = {};
        for (const vote of votes) {
          if (!voteCounts[vote.gameId]) {
            voteCounts[vote.gameId] = { name: vote.game.name, count: 0 };
          }
          voteCounts[vote.gameId].count++;
        }

        const totalVotes = votes.length;
        const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1].count - a[1].count);
        const topVoteCount = sortedVotes[0][1].count;

        let falloutContent = "```diff";
        for (const [_, { name, count }] of sortedVotes) {
          const percentage = Math.round((count / totalVotes) * 100);
          const bar = "█".repeat(Math.round(percentage / 10)).padEnd(10, "░");
          const prefix = count === topVoteCount ? "+" : "-";
          const fixedName = name.length > 18 ? name.slice(0, 15) + "..." : name.padEnd(18, " ");
          falloutContent += `\n${prefix} ${fixedName} ${bar} ${percentage}%${count === topVoteCount ? " 🏆" : ""}`;
        }
        falloutContent += "\n```";

        const winnerName = sortedVotes.find(([id]) => id === poll.winnerId)?.[1].name || "Unbekannt";

        const embed = new EmbedBuilder()
          .setTitle("📊 Fallout-Terminal: M.E.A.T.-Archiv-Protokoll")
          .setDescription(`${falloutContent}\n💾 Gewonnen hat: **${winnerName}**`)
          .setColor(0x00AEFF);

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // === 6. Fallback Modal ===
      if (interaction.isModalSubmit()) {
        logSystem(`📝 Modal abgeschickt (unbekannt): ${interaction.customId}`);
        await interaction.reply({
          content: `Danke für dein Formular: **${interaction.customId}**.`,
          ephemeral: true
        });
        return;
      }

      // === 6. Fallback Modal ===
      if (interaction.isModalSubmit()) {
        logSystem(`📝 Modal abgeschickt (unbekannt): ${interaction.customId}`);
        await interaction.reply({
          content: `Danke für dein Formular: **${interaction.customId}**.`,
          ephemeral: true
        });
        return;
      }

      // === 7. FunGames: Poll starten ===
      if (interaction.isButton() && interaction.customId === "start_poll_fungames") {
        console.log("🎲 FunGames Voting-Button gedrückt");
        const { default: handleStartPollFungames } = await import("@interactions/buttons/startPollFungames.js");
        return await handleStartPollFungames(interaction);
      }

    } catch (error) {
      console.error("❌ Fehler bei Interaktion:", error);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: "❌ Es ist ein Fehler aufgetreten.",
          ephemeral: true
        });
      }
    }
  });

  logSystem("✅ Interaktionen registriert.");
}
