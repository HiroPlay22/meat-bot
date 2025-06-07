// bot/interactions/handler.ts

import {
  Client,
  Interaction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
  SelectMenuBuilder
} from "discord.js";

import { loadSlashCommands } from "../loader/commandLoader.js";
import { logSystem } from "@services/internal/log";
import { prisma } from "@database/client.js";
import { handleFeedbackModal } from "@modules/feedback/handleModal.js";
import { handleRollButtons } from "@modules/roll/handleRollButtons.js";

import serverSettings from "@config/serverSettings.json" with { type: "json" };

import {
  loadGportalSettings,
  getServerById
} from '../modules/gportal/loadGportalSettings.js';
import { queryServer } from '../modules/gportal/queryServer.js';
import { buildServerInfoEmbed } from '../modules/gportal/buildServerInfoEmbed.js';
import { buildServerOverviewEmbed } from '../modules/gportal/buildServerOverviewEmbed.js';
import { buildServerButtons } from '@/modules/gportal/buildServerButtons.js';


// Hilfsfunktion für Spiel-Löschseiten
async function buildGameDeletePage(interaction: Interaction, page: number) {
  const PAGE_SIZE = 25;
  const allGames = await prisma.funGame.findMany({ orderBy: { name: "asc" } });
  const totalPages = Math.ceil(allGames.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * PAGE_SIZE;
  const games = allGames.slice(start, start + PAGE_SIZE);

  const select = new StringSelectMenuBuilder()
    .setCustomId(`delete_game_select_page_${currentPage}`)
    .setPlaceholder("Wähle Spiel(e) zum Löschen...")
    .setMinValues(1)
    .setMaxValues(games.length)
    .addOptions(
      games.map(game => ({
        label: game.name,
        value: game.id
      }))
    );

  const selectRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

  const backButton = new ButtonBuilder()
    .setCustomId(`game_page_back_${currentPage}`)
    .setLabel("⬅️ Zurück")
    .setStyle(2)
    .setDisabled(currentPage === 1);

  const nextButton = new ButtonBuilder()
    .setCustomId(`game_page_next_${currentPage}`)
    .setLabel("Weiter ➡️")
    .setStyle(2)
    .setDisabled(currentPage === totalPages);

  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

  return {
    content: `❌ Spiel löschen – Seite ${currentPage} von ${totalPages}`,
    components: [selectRow, navRow],
    ephemeral: true
  };
}

export async function registerInteractions(client: Client) {
  const commandMap = await loadSlashCommands();

  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      console.log("⚡ interactionCreate fired");

      // === DinoName: Würfeln
      if (interaction.isButton() && interaction.customId === "dinoname_generate") {
        const { handleDinoGenerate } = await import("@modules/dinos/handleDinoGenerate.js")
        return await handleDinoGenerate(interaction)
      }

      // === Dino Dropdown-Auswahl speichern
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith("dino_")) {
        const { handleDinoSelect } = await import("@modules/dinos/handleDinoSelect.js")
        return await handleDinoSelect(interaction)
      }

      // === 1. Slash Commands ===
      if (interaction.isChatInputCommand()) {
        const handler = commandMap.get(interaction.commandName);
        const userMention = `<@${interaction.user.id}>`;
        const userId = interaction.user.id;

        await logSystem(
          `🧾 /${interaction.commandName} ausgeführt von ${userMention} (ID: ${userId})`,
          interaction.client
        );

        if (!handler) {
          await logSystem(
            `⚠️ Kein Handler für Slash-Command: /${interaction.commandName}`,
            interaction.client
          );
          return interaction.reply({
            content: "Unbekannter Befehl.",
            ephemeral: true
          });
        }

        try {
          await handler(interaction as ChatInputCommandInteraction);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          await logSystem(
            `❌ Fehler bei /${interaction.commandName} von ${userMention}: ${errMsg}`,
            interaction.client
          );

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "Beim Ausführen des Befehls ist ein Fehler aufgetreten.",
              ephemeral: true
            }).catch(() => {});
          }
        }

        return;
      }

      // === 2. Feedback Modal SUBMIT ===
      if (interaction.isModalSubmit() && interaction.customId === "feedback_modal") {
        await handleFeedbackModal(interaction as ModalSubmitInteraction);
        return;
      }

      // === 3. Feedback öffnen
      if (interaction.isButton() && interaction.customId === "open_feedback_modal") {
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

      // === ROLL: Button
      if (interaction.isButton() && interaction.customId.startsWith("roll_")) {
        const { handleRollButtons } = await import("@modules/roll/handleRollButtons.js");

        // Nur ausführen, wenn Interaction nicht bereits verarbeitet
        if (interaction.replied || interaction.deferred) {
          console.warn(`⚠️ ROLL: Interaktion ${interaction.customId} bereits beantwortet.`);
          return;
        }

        try {
          return await handleRollButtons(interaction);
        } catch (err) {
          console.error(`❌ Fehler beim ROLL-Handling (${interaction.customId}):`, err);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '❌ Beim Würfeln ist etwas schiefgelaufen.',
              ephemeral: true
            }).catch(() => {});
          }
        }
      }

      // GPORTAL Icons (evtl. global importieren)
      const gameIcons: Record<string, string> = {
        ark: '🦖',
        valheim: '🧊',
        palworld: '🐲',
        minecraft: '🧱',
        default: '🎮'
      };

      // === GPORTAL: Server-Info
      if (interaction.isButton() && interaction.customId.startsWith('view_server_')) {
        const serverId = interaction.customId.replace('view_server_', '');
        const config = getServerById(serverId);

        if (!config) {
          return interaction.reply({ content: 'Serverkonfiguration nicht gefunden.', ephemeral: true });
        }

        const live = await queryServer(config);
        const embed = buildServerInfoEmbed(config, live);
        const buttons = buildServerButtons(config);

        return interaction.update({
          embeds: [embed],
          components: buttons
        });
      }

      // === GPORTAL: Übersicht wiederherstellen
      if (interaction.isButton() && interaction.customId === 'back_to_overview') {
        const embed = buildServerOverviewEmbed();
        const servers = loadGportalSettings();

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        let currentRow = new ActionRowBuilder<ButtonBuilder>();

        for (const server of servers) {
          const icon = gameIcons[server.type] || gameIcons.default;
          const labelRaw = `${icon} ${server.name}`;
          const label = labelRaw.length > 80 ? labelRaw.slice(0, 77) + '…' : labelRaw;

          const button = new ButtonBuilder()
            .setCustomId(`view_server_${server.id}`)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary);

          currentRow.addComponents(button);

          if (currentRow.components.length >= 2) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder<ButtonBuilder>();
          }
        }

        if (currentRow.components.length > 0) {
          rows.push(currentRow);
        }

        return interaction.update({
          embeds: [embed],
          components: rows
        });
      }

      // === DinoName: Würfeln
      if (interaction.isButton() && interaction.customId === "dinoname_generate") {
        const { handleDinoGenerate } = await import("@modules/dinos/handleDinoGenerate.js")
        return await handleDinoGenerate(interaction)
      }

      // === Dino Dropdown-Auswahl speichern
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith("dino_")) {
        const { handleDinoSelect } = await import("@modules/dinos/handleDinoSelect.js")
        return await handleDinoSelect(interaction)
      }

      // === Dino Vorschlag senden
      if (interaction.isButton() && interaction.customId === 'dinoname_submit') {
        const modal = new ModalBuilder()
          .setCustomId('dinoname_submit_modal')
          .setTitle('Dino-Vorschlag einreichen')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('suggested_name')
                .setLabel('Dein Namensvorschlag')
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            )
          )

        await interaction.showModal(modal)
        return
      }

      // === Dino Vorschlag Modal SUBMIT
      if (interaction.isModalSubmit() && interaction.customId === 'dinoname_submit_modal') {
        const name = interaction.fields.getTextInputValue('suggested_name')
        const { submitSuggestion } = await import('@/modules/dinos/submitSuggestion.js')



        await submitSuggestion({
          guildId: interaction.guildId!,
          member: interaction.member!,
          name
        })

        await interaction.reply({
          content: `✅ Name **${name}** eingereicht!`,
          ephemeral: true
        })
        return
      }

      // === Dino Vorschlag genehmigen
      if (interaction.isButton() && interaction.customId.startsWith('approve_dinoname_')) {
        const name = interaction.customId.replace('approve_dinoname_', '')
        const settings = serverSettings.guilds[interaction.guildId!]
        const modCat = settings?.modCategoryId
        const member = interaction.member

        if (!modCat || !interaction.guild?.channels.cache.get(modCat)?.permissionsFor(member!)?.has('ViewChannel')) {
          return interaction.reply({ content: '❌ Keine Berechtigung.', ephemeral: true })
        }

        const alreadyApproved = await prisma.dinoName.findFirst({ where: { name } })
        if (alreadyApproved) {
          return interaction.update({
            embeds: [
              EmbedBuilder.from(interaction.message.embeds[0])
                .setTitle('⚠️ Name war schon vorhanden')
                .setColor(0xf5a623)
            ],
            components: []
          })
        }

        await prisma.dinoName.create({ data: { name, approved: true } })

        await interaction.update({
          embeds: [
            EmbedBuilder.from(interaction.message.embeds[0])
              .setTitle('✅ Name hinzugefügt')
              .setColor(0x7ed321)
              .setFooter({
                text: `freigegeben von ${interaction.user.displayName}`,
                iconURL: interaction.user.displayAvatarURL()
              })
          ],
          components: []
        })

        return
      }


      if (interaction.isButton() && interaction.customId.startsWith('reject_dinoname_')) {
        const name = interaction.customId.replace('reject_dinoname_', '')
        const settings = serverSettings.guilds[interaction.guildId!]
        const modCat = settings?.modCategoryId
        const member = interaction.member

        if (!modCat || !interaction.guild?.channels.cache.get(modCat)?.permissionsFor(member!)?.has('ViewChannel')) {
          return interaction.reply({ content: '❌ Keine Berechtigung.', ephemeral: true })
        }

        // Nur reagieren, wenn Buttons vorhanden sind (nicht erneut bearbeitbar)
        if (!interaction.message.components.length) {
          return interaction.reply({ content: '⚠️ Dieser Vorschlag wurde bereits bearbeitet.', ephemeral: true })
        }

        await interaction.update({
          embeds: [
            EmbedBuilder.from(interaction.message.embeds[0])
              .setTitle('❌ Abgelehnt')
              .setColor(0xd0021b)
              .setFooter({
                text: `abgelehnt von ${interaction.user.displayName}`,
                iconURL: interaction.user.displayAvatarURL()
              })
          ],
          components: []
        })

        return
      }



      // === 4. Spiel hinzufügen – Modal öffnen (nur für Mods)
      if (interaction.isButton() && interaction.customId === "add_game_fungames") {
        const settings = serverSettings.guilds[interaction.guildId!];
        const modCategoryId = settings?.modCategoryId;
        const modCategory = interaction.guild?.channels.cache.get(modCategoryId ?? "");
        const allowed = modCategory?.permissionsFor(interaction.member!)?.has("ViewChannel");

        if (!allowed) {
          return interaction.reply({
            content: "❌ Du hast keinen Zugriff auf diesen Bereich.",
            ephemeral: true
          });
        }

        const modal = new ModalBuilder()
          .setCustomId("modal_add_game_fungames")
          .setTitle("➕ Spiel hinzufügen")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("game_name")
                .setLabel("Name des Spiels")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("game_free")
                .setLabel("Ist das Spiel kostenlos? (ja/nein)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );

        await interaction.showModal(modal);
        return;
      }

      // === 5. Spiel hinzufügen – Modal SUBMIT
      if (interaction.isModalSubmit() && interaction.customId === "modal_add_game_fungames") {
        const gameName = interaction.fields.getTextInputValue("game_name");
        const freeInput = interaction.fields.getTextInputValue("game_free").toLowerCase();
        const isFree = freeInput === "ja" || freeInput === "yes" || freeInput === "true";

        const settings = serverSettings.guilds[interaction.guildId!];
        const modCategoryId = settings?.modCategoryId;
        const modCategory = interaction.guild?.channels.cache.get(modCategoryId ?? "");
        const allowed = modCategory?.permissionsFor(interaction.member!)?.has("ViewChannel");

        if (!allowed) {
          return interaction.reply({
            content: "❌ Du hast keinen Zugriff auf diesen Bereich.",
            ephemeral: true
          });
        }

        const exists = await prisma.funGame.findFirst({
          where: { name: gameName.trim() }
        });

        if (exists) {
          return interaction.reply({
            content: "⚠️ Dieses Spiel ist bereits in der Liste.",
            ephemeral: true
          });
        }

        await prisma.funGame.create({
          data: {
            name: gameName.trim(),
            isFree
          }
        });

        return interaction.reply({
          content: `✅ \`${gameName}\` wurde zur Fungames-Liste hinzugefügt.`,
          ephemeral: true
        });
      }

            // === 6. Spiel entfernen – SelectMenu öffnen mit Paging
      if (interaction.isButton() && interaction.customId === "remove_game_fungames") {
        const settings = serverSettings.guilds[interaction.guildId!];
        const modCategoryId = settings?.modCategoryId;
        const modCategory = interaction.guild?.channels.cache.get(modCategoryId ?? "");
        const allowed = modCategory?.permissionsFor(interaction.member!)?.has("ViewChannel");

        if (!allowed) {
          return interaction.reply({
            content: "❌ Du hast keinen Zugriff auf diesen Bereich.",
            ephemeral: true
          });
        }

        const data = await buildGameDeletePage(interaction, 1);
        return interaction.reply(data);
      }

      // === 7. Paging Buttons für Spiel löschen
      if (interaction.isButton() && interaction.customId.startsWith("game_page_")) {
        const [, , direction, currentStr] = interaction.customId.split("_");
        const current = parseInt(currentStr);
        const newPage = direction === "next" ? current + 1 : current - 1;

        const data = await buildGameDeletePage(interaction, newPage);
        return interaction.update(data);
      }

      // === 8. Spiel löschen – Auswahl mit Mehrfachauswahl
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith("delete_game_select_page_")) {
        const selectedIds = interaction.values;

        const games = await prisma.funGame.findMany({
          where: { id: { in: selectedIds } }
        });

        if (games.length === 0) {
          return interaction.reply({
            content: "❌ Keine gültigen Spiele ausgewählt.",
            ephemeral: true
          });
        }

        await prisma.funGame.deleteMany({
          where: { id: { in: selectedIds } }
        });

        const names = games.map(g => `• ${g.name}`).join("\n");

        return interaction.update({
          content: `✅ Gelöscht:\n${names}`,
          components: []
        });
      }

      // === 9. Fungames-Liste anzeigen
      if (interaction.isButton() && interaction.customId === "show_fungames_list") {
        const games = await prisma.funGame.findMany({ orderBy: { name: "asc" } });
        const gameCount = games.length;

        // 📊 Stat erhöhen (Fungames-Ansicht)
        await prisma.guildStats.updateMany({
          where: { guildId: interaction.guildId },
          data: { fungamesViews: { increment: 1 } }
        });

        const gameList = games.map(g => `• ${g.name}`).join('\n');

        const embed = new EmbedBuilder()
          .setTitle(`🕹️ Fungames-Liste (${gameCount})`)
          .setDescription(
            gameCount > 0
              ? gameList
              : "*Keine Games gefunden. Datenbank defekt oder rebellisch.*"
          )
          .setColor(0x7ED321)
          .setFooter({
            text: "M.E.A.T. hat alles auf Lager. Du musst nur wählen."
          });

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // === 10. Fungames Voting starten
      if (interaction.isButton() && interaction.customId === "start_poll_fungames") {
        // 🗳️ Stat erhöhen (Voting gestartet)
        await prisma.guildStats.updateMany({
          where: { guildId: interaction.guildId },
          data: { votingsStarted: { increment: 1 } }
        });

        const { default: handleStartPollFungames } = await import("@interactions/buttons/startPollFungames.js");
        return await handleStartPollFungames(interaction);
      }


      // === 11. Fungames Voting beenden
      if (interaction.isButton() && interaction.customId.startsWith("end_poll_fungames_")) {
        const pollId = interaction.customId.replace("end_poll_fungames_", "");

        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: { games: true }
        });
        if (!poll) return;

        const message = await interaction.channel?.messages.fetch(poll.messageId);
        if (!message?.poll) return;

        await message.poll.end();
        await prisma.poll.update({
          where: { id: pollId },
          data: { endedAt: new Date() }
        });

        try {
          await interaction.message.delete();
        } catch (err) {
          console.warn("⚠️ Konnte alte Button-Nachricht nicht löschen:", err);
        }

        const embed = new EmbedBuilder()
          .setTitle("📣 Abstimmung wurde beendet")
          .setDescription("Wähle jetzt direkt das Gewinner-Spiel aus dem Dropdown aus.")
          .setColor(0xf5a623);

        const menu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`set_winner_fungames_${pollId}`)
            .setPlaceholder("🏆 Sieger-Spiel auswählen...")
            .addOptions(
              poll.games.map(game => ({
                label: game.name,
                value: game.id
              }))
            )
        );

        await interaction.channel?.send({
          embeds: [embed],
          components: [menu]
        });

        return interaction.deferUpdate();
      }

            // === 12. Gewinner speichern
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith("set_winner_fungames_")) {
        const pollId = interaction.customId.replace("set_winner_fungames_", "");
        const selected = interaction.values[0];

        const updatedPoll = await prisma.poll.update({
          where: { id: pollId },
          data: { winnerId: selected },
          include: { games: true }
        });

        const winnerName = updatedPoll.games.find(g => g.id === selected)?.name || "Unbekannt";

        const embed = new EmbedBuilder()
          .setTitle("Widerstand zwecklos. Die Entscheidung steht.")
          .setDescription(`Dieser Montag gehört: 🏆 **${winnerName}**`)
          .setColor(0x00aeff);

        try {
          await interaction.message.delete();
        } catch (e) {
          console.warn("⚠️ Fehler beim Löschen der Select-Message:", e);
        }

        await interaction.channel?.send({ embeds: [embed] });

        return interaction.deferUpdate();
      }

      // === ROLL: Modifier Modal
      if (interaction.isModalSubmit() && interaction.customId === "roll_modifier_modal") {
        const { handleRollModal } = await import("@modules/roll/handleRollModal.js");
        return await handleRollModal(interaction);
      }


      // === STATS: Button-Navigation
      if (interaction.isButton() && interaction.customId.startsWith("stats_")) {
        const [_, view, userId] = interaction.customId.split("_")
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: "⛔ Nur du darfst deine Stats klicken.",
            ephemeral: true
          })
        }

        const { handleStatsButton } = await import("@interactions/buttons/statsHandler.js")
        return await handleStatsButton(interaction, view)
      }
      
      // In deiner zentralen Interaktions-Logik:
      if (interaction.isButton()) {
        if (interaction.customId === 'open_stats') {
          // Direktes Einsteigen in den Stats-Modus mit Default „server“
          const { handleStatsButton } = await import('@/interactions/buttons/statsHandler.js')
          return handleStatsButton(interaction, 'server')
        }
      }


    } catch (error) {
      console.error("❌ Fehler bei Interaktion:", error);

      const userMention = `<@${interaction.user?.id ?? '??'}>`;
      const displayName = (interaction.member as any)?.displayName || interaction.user?.tag || 'Unbekannt';

      let identifier = 'Unbekannte Interaktion';
      if (interaction.isChatInputCommand()) {
        identifier = `/${interaction.commandName}`;
      } else if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isModalSubmit()
      ) {
        identifier = `CustomID: ${interaction.customId}`;
      }

      const errMsg = error instanceof Error ? error.message : String(error);

      await logSystem(
        `❌ Fehler bei Interaktion ${identifier} von ${userMention}: ${errMsg}`,
        interaction.client
      );

      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Es ist ein Fehler aufgetreten.",
          ephemeral: true
        }).catch(() => {});
      }
    }

  });

  logSystem("✅ Interaktionen registriert.");
}
