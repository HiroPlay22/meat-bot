import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type Guild,
  type GuildTextBasedChannel,
  type Message,
  MessageType,
} from "discord.js";
import { baueMontagPreviewView, baueMontagSetupView } from "./montag.embeds.js";
import {
  createNativeMontagPoll,
  ermittleAusgeschlosseneGewinner,
  ermittleGesamtGameCount,
  ermittleMontagPollErgebnis,
  getOrInitSetupState,
  getSetupState,
  prepareRandomGamesForState,
  resetSetupState,
} from "./montag.service.js";
import { bauePollCenterView } from "../poll.embeds.js";
import {
  beendeMontagPoll,
  findeAktivenMontagPoll,
  findeMontagPollByMessage,
  legeMontagPollAn,
  setMontagWinner,
} from "../poll.db.js";
import { ladeServerEinstellungen } from "../../../general/config/server-settings-loader.js";
import { logError, logInfo } from "../../../general/logging/logger.js";

function ermittleNaechstenMontag19Uhr(): string {
  const jetzt = new Date();
  const tag = jetzt.getDay();
  const tageBisMontag = (1 - tag + 7) % 7;
  const ziel = new Date(jetzt);
  ziel.setDate(jetzt.getDate() + tageBisMontag);
  ziel.setHours(19, 0, 0, 0);

  const wochentage = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const wt = wochentage[ziel.getDay()];
  const tagNum = ziel.getDate().toString().padStart(2, "0");
  const monatNum = (ziel.getMonth() + 1).toString().padStart(2, "0");

  return `${wt}, ${tagNum}.${monatNum}. um 19:00 Uhr`;
}

const tieCandidatesPerPoll = new Map<string, string[]>();
const closingPollIds = new Set<string>();

function bauePollLinkRow(pollUrl: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(pollUrl)
      .setLabel("Zur Umfrage"),
  );
}

async function deleteInteractionMessageIfPossible(
  interaction: ButtonInteraction,
): Promise<void> {
  try {
    if (interaction.message && interaction.message.deletable) {
      await interaction.message.delete();
    }
  } catch {
    // best effort
  }
}

async function deleteInteractionReplySafe(
  interaction: ButtonInteraction,
): Promise<void> {
  try {
    await interaction.deleteReply();
    return;
  } catch {
    // fallback
  }
  await deleteInteractionMessageIfPossible(interaction);
}

async function sendeMontagErgebnisNachricht(params: {
  guild: Guild;
  pollChannelId: string;
  announcementChannelId: string | null;
  embed: EmbedBuilder;
  components?: ActionRowBuilder<ButtonBuilder>[];
  announcementComponents?: ActionRowBuilder<ButtonBuilder>[];
}): Promise<void> {
  const {
    guild,
    pollChannelId,
    announcementChannelId,
    embed,
    components = [],
    announcementComponents,
  } = params;

  try {
    const pollChannel = await guild.channels.fetch(pollChannelId);
    if (pollChannel && pollChannel.isTextBased()) {
      await pollChannel.send({ embeds: [embed], components });
    }
  } catch (error) {
    logError("Konnte Montags-Ergebnis nicht in Poll-Channel senden", {
      functionName: "sendeMontagErgebnisNachricht",
      guildId: guild.id,
      extra: { pollChannelId, announcementChannelId, error },
    });
  }

  if (announcementChannelId && announcementChannelId !== pollChannelId) {
    try {
      const announcementChannel = await guild.channels.fetch(
        announcementChannelId,
      );
      if (announcementChannel && announcementChannel.isTextBased()) {
        await announcementChannel.send({
          embeds: [embed],
          components: announcementComponents ?? components,
        });
      }
    } catch (error) {
      logError(
        "Konnte Montags-Ergebnis nicht im Announcement-Channel senden",
        {
          functionName: "sendeMontagErgebnisNachricht",
          guildId: guild.id,
          extra: { pollChannelId, announcementChannelId, error },
        },
      );
    }
  }
}
export async function handleMontagPollButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId || !interaction.guild) {
    await interaction.reply({
      content: "Die Montags-Runde kann nur auf einem Server verwendet werden.",
      ephemeral: true,
    });
    return;
  }

  const guild = interaction.guild;
  const customId = interaction.customId;
  const serverName = guild.name;
  const nextMontagText = ermittleNaechstenMontag19Uhr();

  const settings = await ladeServerEinstellungen(guildId);
  const montagSettings = settings.functions.polls?.montag;
  const spezifisch = montagSettings?.spezifisch;
  const allowedRoleIds = spezifisch?.allowedRoleIds ?? [];
  const announcementChannelId = spezifisch?.announcementChannelId ?? null;

  try {
    async function checkPermissions(): Promise<boolean> {
      if (!allowedRoleIds.length) return true;

      const g = interaction.guild;
      if (!g) {
        await interaction.reply({
          content:
            "Ich konnte den Server-Kontext nicht ermitteln. Bitte probiere es noch einmal.",
          ephemeral: true,
        });
        return false;
      }

      const member = await g.members.fetch(userId);
      const hatRolle = member.roles.cache.some((role) =>
        allowedRoleIds.includes(role.id),
      );

      if (!hatRolle) {
        await interaction.reply({
          content:
            "Du hast keine Berechtigung, die Montags-Runde zu konfigurieren oder zu starten.",
          ephemeral: true,
        });
        return false;
      }

      return true;
    }

    // 1) Einstieg aus dem Poll-Center: "Montags-Runde"
    if (customId === "poll_type_montag") {
      const ok = await checkPermissions();
      if (!ok) return;

      const aktiverPoll = await findeAktivenMontagPoll(guildId);

      if (aktiverPoll) {
        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

        const embed = new EmbedBuilder()
          .setTitle("Montags-Runde – Umfrage läuft bereits")
          .setDescription(
            [
              "Es gibt bereits eine aktive Umfrage für die Montags-Runde.",
              "Du kannst die Umfrage hier auch direkt schließen.",
            ].join("\n"),
          )
          .setColor(0xfee75c);

        const linkButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(pollUrl)
          .setLabel("Zur Umfrage");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("poll_montag_close_active")
            .setStyle(ButtonStyle.Danger)
            .setLabel("Umfrage schließen"),
          linkButton,
        );

        await interaction.update({
          embeds: [embed],
          components: [row],
        });

        return;
      }

      const state = getOrInitSetupState(guildId, userId);
      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }
    // 2) Setup-Buttons
    if (customId === "poll_montag_prepare") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = await prepareRandomGamesForState(guildId, userId);

      const { embed, components } = baueMontagPreviewView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_add_game") {
      const ok = await checkPermissions();
      if (!ok) return;

      const modal = new ModalBuilder()
        .setCustomId("poll_montag_add_game_modal")
        .setTitle("Neues Spiel – Montags-Runde");

      const nameInput = new TextInputBuilder()
        .setCustomId("poll_montag_add_game_name")
        .setLabel("Spielname")
        .setPlaceholder("z.B. Gartic Phone")
        .setRequired(true)
        .setMaxLength(100)
        .setStyle(TextInputStyle.Short);

      const isFreeInput = new TextInputBuilder()
        .setCustomId("poll_montag_add_game_is_free")
        .setLabel("Kostenlos spielbar? (ja/nein)")
        .setPlaceholder("ja oder nein")
        .setRequired(true)
        .setMaxLength(10)
        .setStyle(TextInputStyle.Short);

      const maxPlayersInput = new TextInputBuilder()
        .setCustomId("poll_montag_add_game_max_players")
        .setLabel("Max. Spieler (optional)")
        .setPlaceholder("z.B. 4, 8, 16 – leer lassen, falls egal")
        .setRequired(false)
        .setMaxLength(10)
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(isFreeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(maxPlayersInput),
      );

      await interaction.showModal(modal);
      return;
    }

    if (customId === "poll_montag_toggle_multiselect") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.allowMultiselect = !state.allowMultiselect;

      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_duration_dec") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.max(1, state.durationHours - 1);

      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_duration_inc") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.min(32 * 24, state.durationHours + 1);

      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_duration_dec5") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.max(1, state.durationHours - 5);

      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_duration_inc5") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.min(32 * 24, state.durationHours + 5);

      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    // 3) Preview-Buttons
    if (customId === "poll_montag_preview_back") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      const gameCount = await ermittleGesamtGameCount();
      const { excludedGameNames } = await ermittleAusgeschlosseneGewinner(
        guildId,
        2,
      );

      const { embed, components } = baueMontagSetupView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        gameCount,
        state,
        excludedGameNames,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_reroll") {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = await prepareRandomGamesForState(guildId, userId);

      const { embed, components } = baueMontagPreviewView({
        serverName,
        serverIconUrl: interaction.guild?.iconURL(),
        nextMontagText,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === "poll_montag_cancel") {
      const ok = await checkPermissions();
      if (!ok) return;

      resetSetupState(guildId, userId);
      const { embed, components } = bauePollCenterView(serverName);

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }
    // 4) "Umfrage schließen"-Button für laufenden Poll
    if (customId === "poll_montag_close_active") {
      const ok = await checkPermissions();
      if (!ok) return;

      const aktiverPoll = await findeAktivenMontagPoll(guildId);

      if (!aktiverPoll) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Keine aktive Montags-Umfrage")
              .setDescription("Es ist aktuell keine Montags-Runde-Umfrage aktiv.")
              .setColor(0xed4245),
          ],
          components: [],
        });
        return;
      }

      try {
        await interaction.deferUpdate();
        closingPollIds.add(aktiverPoll.id);

        const channel = await guild.channels.fetch(aktiverPoll.channelId);
        if (!channel || !channel.isTextBased()) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Poll-Channel nicht gefunden")
                .setDescription(
                  "Ich konnte den Poll-Channel nicht laden. Vielleicht wurde der Channel oder die Nachricht gelöscht?",
                )
                .setColor(0xed4245),
            ],
            components: [],
          });
          return;
        }

        const textChannel = channel as GuildTextBasedChannel;
        const message = await textChannel.messages.fetch(aktiverPoll.messageId);

        let pollAny = message.poll as any;

        if (pollAny && typeof pollAny.end === "function") {
          try {
            await pollAny.end();
            const refreshed = await message.fetch();
            pollAny = (refreshed.poll ?? message.poll) as any;
          } catch (err: any) {
            const code = err?.code ?? err?.rawError?.code;
            if (code === 520001) {
              logInfo("Montags-Poll war beim Schließen bereits abgelaufen", {
                functionName: "handleMontagPollButton",
                guildId,
                userId,
                extra: { pollId: aktiverPoll.id },
              });
              const refreshed = await message.fetch();
              pollAny = (refreshed.poll ?? message.poll) as any;
            } else {
              throw err;
            }
          }
        }

        let winnerNames: string[] = [];

        try {
          const rawAnswers = pollAny?.answers;
          const answers: any[] =
            rawAnswers && typeof rawAnswers.map === "function"
              ? rawAnswers.map((a: any) => a)
              : Array.isArray(rawAnswers)
              ? rawAnswers
              : [];

          let maxVotes = 0;

          for (const ans of answers) {
            const votes = Number(ans.voteCount ?? 0);
            if (votes > maxVotes) maxVotes = votes;
          }

          if (maxVotes > 0) {
            winnerNames = answers
              .filter((ans) => Number(ans.voteCount ?? 0) === maxVotes)
              .map((ans) =>
                String(
                  ans.text ??
                    ans.pollMedia?.text ??
                    ans.pollMedia?.question?.text ??
                    "",
                ).trim(),
              )
              .filter((name) => name.length > 0);
          }

          logInfo("Montags-Poll Ergebnis ausgewertet", {
            functionName: "handleMontagPollButton",
            guildId,
            userId,
            extra: {
              pollId: aktiverPoll.id,
              maxVotes,
              answersCount: answers.length,
              answersDebug: answers.map((ans) => ({
                text:
                  ans.text ??
                  ans.pollMedia?.text ??
                  ans.pollMedia?.question?.text ??
                  null,
                voteCount: ans.voteCount ?? 0,
              })),
            },
          });
        } catch (err) {
          logError("Konnte Montags-Poll-Ergebnis nicht auslesen", {
            functionName: "handleMontagPollButton",
            guildId,
            userId,
            extra: { error: err, pollId: aktiverPoll.id },
          });
        }

        await beendeMontagPoll(aktiverPoll.id);

        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;
        const linkRow = bauePollLinkRow(pollUrl);

        if (!winnerNames.length) {
          const embed = new EmbedBuilder()
            .setTitle("Montags-Umfrage geschlossen")
            .setDescription(
              [
                "Die aktive Montags-Runde-Umfrage wurde beendet.",
                "",
                "Es konnten keine gültigen Stimmen ermittelt werden.",
              ].join("\n"),
            )
            .setColor(0xed4245);

          await sendeMontagErgebnisNachricht({
            guild,
            pollChannelId: aktiverPoll.channelId,
            announcementChannelId: null,
            embed,
            components: [linkRow],
          });

          await deleteInteractionMessageIfPossible(interaction);
          return;
        }

        if (winnerNames.length === 1) {
          const winnerName = winnerNames[0];

          const { game } = await setMontagWinner({
            pollId: aktiverPoll.id,
            winnerGameName: winnerName,
          });

          const embed = new EmbedBuilder()
            .setTitle("Montags-Umfrage geschlossen")
            .setDescription(
              [
                "Die aktive Montags-Runde-Umfrage wurde beendet.",
                "",
                `🎉 Gewonnen hat: **${winnerName}**`,
                game
                  ? `(_${game.isFree ? "kostenlos" : "kostenpflichtig"} • max. ${
                      game.maxPlayers ?? "unbegrenzt"
                    } Spieler_)`
                  : "",
              ]
                .filter((line) => line.length > 0)
                .join("\n"),
            )
            .setColor(0x57f287);

          await sendeMontagErgebnisNachricht({
            guild,
            pollChannelId: aktiverPoll.channelId,
            announcementChannelId,
            embed,
            components: [linkRow],
          });

          logInfo("Montags-Poll geschlossen (eindeutiger Gewinner)", {
            functionName: "handleMontagPollButton",
            guildId,
            userId,
            extra: {
              pollId: aktiverPoll.id,
              winnerName,
            },
          });

          await deleteInteractionMessageIfPossible(interaction);
          return;
        }
        tieCandidatesPerPoll.set(aktiverPoll.id, winnerNames);

        const winnerList = winnerNames.map((n) => `• ${n}`).join("\n");

        const embed = new EmbedBuilder()
          .setTitle("Montags-Umfrage geschlossen – Gleichstand")
          .setDescription(
            [
              "Die aktive Montags-Runde-Umfrage wurde beendet.",
              "",
              "Folgende Spiele haben gleich viele Stimmen:",
              winnerList,
              "",
              "Klicke auf „Zufalls-Gewinner ziehen“, um einen Gewinner festzulegen.",
            ].join("\n"),
          )
          .setColor(0xfee75c);

        const randomRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_montag_pick_winner_${aktiverPoll.id}`)
            .setStyle(ButtonStyle.Primary)
            .setLabel("Zufalls-Gewinner ziehen"),
        );

        await sendeMontagErgebnisNachricht({
          guild,
          pollChannelId: aktiverPoll.channelId,
          announcementChannelId: null,
          embed,
          components: [randomRow, linkRow],
          announcementComponents: [linkRow],
        });

        logInfo("Montags-Poll geschlossen (Gleichstand)", {
          functionName: "handleMontagPollButton",
          guildId,
          userId,
          extra: {
            pollId: aktiverPoll.id,
            candidates: winnerNames,
          },
        });

        await deleteInteractionMessageIfPossible(interaction);
        return;
      } catch (error) {
        logError("Fehler beim Schließen des Montags-Polls", {
          functionName: "handleMontagPollButton",
          guildId,
          userId,
          extra: { error, customId },
        });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              "Beim Schließen der Umfrage ist etwas schiefgelaufen. Schau bitte in die Logs.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              "Beim Schließen der Umfrage ist etwas schiefgelaufen. Schau bitte in die Logs.",
            ephemeral: true,
          });
        }

        return;
      } finally {
        await deleteInteractionReplySafe(interaction);
        closingPollIds.delete(aktiverPoll.id);
      }
    }

    // 4b) Gleichstand auflösen: Zufalls-Gewinner ziehen
    if (customId.startsWith("poll_montag_pick_winner_")) {
      const ok = await checkPermissions();
      if (!ok) return;

      const pollId = customId.substring("poll_montag_pick_winner_".length);

      const candidates = tieCandidatesPerPoll.get(pollId);

      if (!candidates || !candidates.length) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Keine Gleichstandsdaten gefunden")
              .setDescription(
                "Ich habe keine gespeicherten Kandidaten mehr. Bitte wähle manuell einen Gewinner aus.",
              )
              .setColor(0xed4245),
          ],
          components: [],
        });
        return;
      }

      tieCandidatesPerPoll.delete(pollId);

      const winnerName =
        candidates[Math.floor(Math.random() * candidates.length)];

      const { poll, game } = await setMontagWinner({
        pollId,
        winnerGameName: winnerName,
      });

      const pollUrl = `https://discord.com/channels/${poll.guildId}/${poll.channelId}/${poll.messageId}`;
      const linkRow = bauePollLinkRow(pollUrl);

      const embed = new EmbedBuilder()
        .setTitle("Montags-Umfrage – Gewinner gezogen")
        .setDescription(
          [
            "Der Gleichstand wurde per Zufall aufgelöst.",
            "",
            `🎉 Gewinner: **${winnerName}**`,
            game
              ? `(_${game.isFree ? "kostenlos" : "kostenpflichtig"} • max. ${
                  game.maxPlayers ?? "unbegrenzt"
                } Spieler_)`
              : "",
          ]
            .filter((line) => line.length > 0)
            .join("\n"),
        )
        .setColor(0x57f287);

      await interaction.update({
        embeds: [embed],
        components: [linkRow],
      });

      if (announcementChannelId && announcementChannelId !== poll.channelId) {
        try {
          const announceChannel = await guild.channels.fetch(
            announcementChannelId,
          );
          if (announceChannel && announceChannel.isTextBased()) {
            await announceChannel.send({ embeds: [embed], components: [linkRow] });
          }
        } catch (error) {
          logError("Fehler beim Senden des Zufalls-Gewinners ins Announcement", {
            functionName: "handleMontagPollButton",
            guildId,
            userId,
            extra: { error, pollId },
          });
        }
      }

      logInfo("Gleichstand per Zufalls-Gewinner aufgelöst", {
        functionName: "handleMontagPollButton",
        guildId,
        userId,
        extra: {
          pollId,
          winnerName,
          candidates,
        },
      });

      return;
    }
    // 5) Start-Button
    if (customId === "poll_montag_start") {
      const ok = await checkPermissions();
      if (!ok) return;

      const aktiverPoll = await findeAktivenMontagPoll(guildId);
      if (aktiverPoll) {
        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Montags-Runde läuft bereits")
              .setDescription(
                [
                  "Es gibt bereits einen aktiven Montags-Poll auf diesem Server.",
                  "",
                  `🔗 [Zur laufenden Abstimmung](${pollUrl})`,
                ].join("\n"),
              )
              .setColor(0xfee75c),
          ],
          components: [],
        });

        return;
      }

      const state = getSetupState(guildId, userId);

      if (!state || !state.selectedGames.length) {
        await interaction.reply({
          content:
            "Es sind noch keine Spiele ausgewählt. Bitte zuerst \"Umfrage vorbereiten\" drücken.",
          ephemeral: true,
        });
        return;
      }

      const channelRaw = interaction.channel ?? guild.systemChannel;

      if (!channelRaw || !channelRaw.isTextBased()) {
        await interaction.reply({
          content:
            "Kein gültiger Ziel-Channel gefunden, in dem der Poll erstellt werden kann.",
          ephemeral: true,
        });
        return;
      }

      const zielChannel = channelRaw as GuildTextBasedChannel;

      const questionText = `Was zocken wir in der Montags-Runde am ${nextMontagText}?`;

      const message = await createNativeMontagPoll({
        channel: zielChannel,
        questionText,
        state,
      });

      if (!message) {
        await interaction.reply({
          content:
            "Der native Poll konnte nicht erstellt werden. Prüfe bitte die Berechtigungen von M.E.A.T. im Ziel-Channel.",
          ephemeral: true,
        });
        return;
      }

      try {
        const pinned = await zielChannel.messages.fetchPinned().catch(() => null);
        if (pinned) {
          for (const m of pinned.values()) {
            if (m.author.id === guild.client.user?.id && m.poll) {
              try {
                await m.unpin();
              } catch {
                // best effort
              }
            }
          }
        }
      } catch {
        // best effort
      }

      try {
        if (message.pinnable && !message.pinned) {
          await message.pin();

          const recent = await zielChannel.messages.fetch({ limit: 5 }).catch(() => null);
          if (recent) {
            for (const sysMsg of recent.values()) {
              if (
                sysMsg.type === MessageType.ChannelPinnedMessage &&
                sysMsg.deletable
              ) {
                try {
                  await sysMsg.delete();
                } catch {
                  // best effort
                }
              }
            }
          }
        }
      } catch {
        // nice-to-have
      }

      const pollRecord = await legeMontagPollAn({
        guildId,
        channelId: message.channelId,
        messageId: message.id,
        question: questionText,
      });

      const pollUrl = message.url;

      logInfo("Montags-Poll erstellt", {
        functionName: "handleMontagPollButton",
        guildId,
        channelId: message.channelId,
        userId,
        extra: {
          pollId: pollRecord.id,
          pollUrl,
          durationHours: state.durationHours,
          allowMultiselect: state.allowMultiselect,
          selectedGames: state.selectedGames.map((g) => g.name),
        },
      });

      if (announcementChannelId && announcementChannelId !== message.channelId) {
        try {
          const announceChannel = await guild.channels.fetch(
            announcementChannelId,
          );
          if (announceChannel && announceChannel.isTextBased()) {
            await announceChannel.send({
              content: [
                "📢 **Neue Montags-Runde Umfrage gestartet!**",
                "",
                `🔗 [Zur Abstimmung](${pollUrl})`,
              ].join("\n"),
            });
          }
        } catch {
          // nice-to-have
        }
      }

      resetSetupState(guildId, userId);

      await interaction.deferUpdate();
      await deleteInteractionMessageIfPossible(interaction);

      return;
    }

    // Fallback
    await interaction.reply({
      content: "Dieser Montags-Button wird noch nicht unterstützt.",
      ephemeral: true,
    });
  } catch (error) {
    logError("Fehler im Montags-Poll-Flow", {
      functionName: "handleMontagPollButton",
      guildId,
      userId,
      extra: { error, customId },
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "Uff. Beim Montags-Poll ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "Uff. Beim Montags-Poll ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.",
        ephemeral: true,
      });
    }
  }
}
export async function handleAutoEndedMontagPoll(
  message: Message,
): Promise<void> {
  const pollRecord = await findeMontagPollByMessage(message.id);
  if (!pollRecord) return;

  if (closingPollIds.has(pollRecord.id)) {
    return;
  }

  let currentMessage = message;

  if (currentMessage.partial || !currentMessage.poll) {
    try {
      currentMessage = await currentMessage.fetch();
    } catch (error) {
      logError("Konnte Montags-Poll-Nachricht nicht nachladen", {
        functionName: "handleAutoEndedMontagPoll",
        guildId: pollRecord.guildId,
        extra: { error, pollId: pollRecord.id },
      });
      return;
    }
  }

  const pollData: any = currentMessage.poll;
  if (!pollData) return;

  const hasEnded =
    pollData.resultsFinalized ||
    (typeof pollData.expiresTimestamp === "number" &&
      pollData.expiresTimestamp <= Date.now());

  if (!hasEnded) return;

  const { winnerNames, maxVotes, answersDebug } =
    ermittleMontagPollErgebnis(currentMessage);

  await beendeMontagPoll(pollRecord.id);

  const guild =
    currentMessage.guild ??
    (await currentMessage.client.guilds
      .fetch(pollRecord.guildId)
      .catch(() => null));

  if (!guild) return;

  const settings = await ladeServerEinstellungen(pollRecord.guildId);
  const announcementChannelId =
    settings.functions.polls?.montag?.spezifisch?.announcementChannelId ?? null;

  const pollUrl = `https://discord.com/channels/${pollRecord.guildId}/${pollRecord.channelId}/${pollRecord.messageId}`;
  const linkRow = bauePollLinkRow(pollUrl);

  if (!winnerNames.length) {
    const embed = new EmbedBuilder()
      .setTitle("Montags-Umfrage geschlossen")
      .setDescription(
        [
          "Die aktive Montags-Runde-Umfrage wurde beendet.",
          "",
          "Es konnten keine gültigen Stimmen ermittelt werden.",
        ].join("\n"),
      )
      .setColor(0xed4245);

    await sendeMontagErgebnisNachricht({
      guild,
      pollChannelId: pollRecord.channelId,
      announcementChannelId: null,
      embed,
      components: [linkRow],
    });

    logInfo("Montags-Poll automatisch beendet (keine Stimmen)", {
      functionName: "handleAutoEndedMontagPoll",
      guildId: pollRecord.guildId,
      extra: { pollId: pollRecord.id, maxVotes, answersDebug },
    });

    return;
  }

  if (winnerNames.length === 1) {
    const winnerName = winnerNames[0];

    const { game } = await setMontagWinner({
      pollId: pollRecord.id,
      winnerGameName: winnerName,
    });

    const embed = new EmbedBuilder()
      .setTitle("Montags-Umfrage geschlossen")
      .setDescription(
        [
          "Die aktive Montags-Runde-Umfrage wurde beendet.",
          "",
          `🎉 Gewonnen hat: **${winnerName}**`,
          game
            ? `(_${game.isFree ? "kostenlos" : "kostenpflichtig"} • max. ${
                game.maxPlayers ?? "unbegrenzt"
              } Spieler_)`
            : "",
        ]
          .filter((line) => line.length > 0)
          .join("\n"),
      )
      .setColor(0x57f287);

    await sendeMontagErgebnisNachricht({
      guild,
      pollChannelId: pollRecord.channelId,
      announcementChannelId,
      embed,
      components: [linkRow],
    });

    logInfo("Montags-Poll automatisch beendet (Gewinner)", {
      functionName: "handleAutoEndedMontagPoll",
      guildId: pollRecord.guildId,
      extra: { pollId: pollRecord.id, winnerName, answersDebug },
    });

    return;
  }

  tieCandidatesPerPoll.set(pollRecord.id, winnerNames);

  const winnerList = winnerNames.map((n) => `• ${n}`).join("\n");

  const embed = new EmbedBuilder()
    .setTitle("Montags-Umfrage geschlossen – Gleichstand")
    .setDescription(
      [
        "Die aktive Montags-Runde-Umfrage wurde beendet.",
        "",
        "Folgende Spiele haben gleich viele Stimmen:",
        winnerList,
        "",
        "Klicke auf „Zufalls-Gewinner ziehen“, um einen Gewinner festzulegen.",
      ].join("\n"),
    )
    .setColor(0xfee75c);

  const randomRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`poll_montag_pick_winner_${pollRecord.id}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel("Zufalls-Gewinner ziehen"),
  );

  await sendeMontagErgebnisNachricht({
    guild,
    pollChannelId: pollRecord.channelId,
    announcementChannelId: null,
    embed,
    components: [randomRow, linkRow],
    announcementComponents: [linkRow],
  });

  logInfo("Montags-Poll automatisch beendet (Gleichstand)", {
    functionName: "handleAutoEndedMontagPoll",
    guildId: pollRecord.guildId,
    extra: { pollId: pollRecord.id, candidates: winnerNames, answersDebug },
  });
}
