// FILE: src/bot/functions/polls/montag/montag.buttons.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type GuildTextBasedChannel,
  type Message,
} from 'discord.js';
import {
  baueMontagPreviewView,
  baueMontagSetupView,
} from './montag.embeds.js';
import {
  createNativeMontagPoll,
  ermittleGesamtGameCount,
  getOrInitSetupState,
  getSetupState,
  prepareRandomGamesForState,
  resetSetupState,
} from './montag.service.js';
import { bauePollCenterView } from '../poll.embeds.js';
import {
  beendeMontagPoll,
  findeAktivenMontagPoll,
  legeMontagPollAn,
  setMontagWinner,
} from '../poll.db.js';
import { ladeServerEinstellungen } from '../../../general/config/server-settings-loader.js';
import { logError, logInfo } from '../../../general/logging/logger.js';

function ermittleNaechstenMontag19Uhr(): string {
  const jetzt = new Date();
  const tag = jetzt.getDay();
  const tageBisMontag = (1 - tag + 7) % 7;
  const ziel = new Date(jetzt);
  ziel.setDate(jetzt.getDate() + tageBisMontag);
  ziel.setHours(19, 0, 0, 0);

  const wochentage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const wt = wochentage[ziel.getDay()];
  const tagNum = jetzt.getDate().toString().padStart(2, '0');
  const monatNum = (jetzt.getMonth() + 1).toString().padStart(2, '0');

  return `${wt}, ${tagNum}.${monatNum}. um 19:00 Uhr`;
}

// Merkt sich bei Gleichstand die Kandidaten pro Poll,
// damit wir später per Button einen Zufalls-Gewinner ziehen können.
const tieCandidatesPerPoll = new Map<string, string[]>();

interface SimplePollAnswer {
  text: string;
  votes: number;
}

/**
 * Versucht, aus einem nativen Discord-Poll die Antworten + Gewinner zu ermitteln.
 * Da das Poll-Objekt intern nicht öffentlich typisiert ist, arbeiten wir hier
 * bewusst defensiv mit "any".
 */
function ermittlePollGewinnerAusMessage(
  message: Message<boolean>,
): {
  answers: SimplePollAnswer[];
  topAnswers: SimplePollAnswer[];
  maxVotes: number;
} | null {
  const rawPoll: any = message.poll;
  if (!rawPoll) return null;

  let rawAnswers: any[] = [];

  if (Array.isArray(rawPoll.answers)) {
    rawAnswers = rawPoll.answers;
  } else if (rawPoll.answers && typeof rawPoll.answers.values === 'function') {
    rawAnswers = Array.from(rawPoll.answers.values());
  } else if (rawPoll.answers && typeof rawPoll.answers.toJSON === 'function') {
    rawAnswers = rawPoll.answers.toJSON();
  }

  const answers: SimplePollAnswer[] = rawAnswers
    .map((a: any): SimplePollAnswer => {
      const text = String(
        a.text ?? a.answer ?? a.label ?? a.title ?? '',
      ).trim();

      const votesRaw =
        a.voteCount ?? a.votes ?? a.count ?? a.totalVotes ?? 0;

      const votes =
        typeof votesRaw === 'number'
          ? votesRaw
          : Number(votesRaw) || 0;

      return { text, votes };
    })
    .filter((a: SimplePollAnswer) => a.text.length > 0);

  if (!answers.length) return null;

  const maxVotes = Math.max(...answers.map((a: SimplePollAnswer) => a.votes));
  const topAnswers = answers.filter(
    (a: SimplePollAnswer) => a.votes === maxVotes && maxVotes > 0,
  );

  return { answers, topAnswers, maxVotes };
}

export async function handleMontagPollButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId || !interaction.guild) {
    await interaction.reply({
      content: 'Die Montags-Runde kann nur auf einem Server verwendet werden.',
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
            'Ich konnte den Server-Kontext nicht ermitteln. Bitte probiere es noch einmal.',
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
            'Du hast keine Berechtigung, die Montags-Runde zu konfigurieren oder zu starten.',
          ephemeral: true,
        });
        return false;
      }

      return true;
    }

    // 1) Einstieg aus dem Poll-Center: "Montags-Runde"
    if (customId === 'poll_type_montag') {
      const ok = await checkPermissions();
      if (!ok) return;

      const aktiverPoll = await findeAktivenMontagPoll(guildId);

      if (aktiverPoll) {
        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

        const embed = new EmbedBuilder()
          .setTitle('Montags-Runde – Umfrage läuft bereits')
          .setDescription(
            [
              'Es gibt bereits eine aktive Umfrage für die Montags-Runde.',
              '',
              `🔗 [Zur laufenden Abstimmung](${pollUrl})`,
              '',
              'Du kannst die Umfrage hier auch direkt schließen.',
            ].join('\n'),
          )
          .setColor(0xfee75c);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('poll_montag_close_active')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Umfrage schließen'),
        );

        await interaction.update({
          embeds: [embed],
          components: [row],
        });

        return;
      }

      const state = getOrInitSetupState(guildId, userId);
      const gameCount = await ermittleGesamtGameCount();

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    // 2) Setup-Buttons
    if (customId === 'poll_montag_prepare') {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = await prepareRandomGamesForState(guildId, userId);

      const { embed, components } = baueMontagPreviewView({
        serverName,
        nextMontagText,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    // 🔹 "Spiel hinzufügen" → Modal öffnen
    if (customId === 'poll_montag_add_game') {
      const ok = await checkPermissions();
      if (!ok) return;

      const modal = new ModalBuilder()
        .setCustomId('poll_montag_add_game_modal')
        .setTitle('Neues Spiel – Montags-Runde');

      const nameInput = new TextInputBuilder()
        .setCustomId('poll_montag_add_game_name')
        .setLabel('Spielname')
        .setPlaceholder('z.B. Gartic Phone')
        .setRequired(true)
        .setMaxLength(100)
        .setStyle(TextInputStyle.Short);

      const isFreeInput = new TextInputBuilder()
        .setCustomId('poll_montag_add_game_is_free')
        .setLabel('Kostenlos spielbar? (ja/nein)')
        .setPlaceholder('ja oder nein')
        .setRequired(true)
        .setMaxLength(10)
        .setStyle(TextInputStyle.Short);

      const maxPlayersInput = new TextInputBuilder()
        .setCustomId('poll_montag_add_game_max_players')
        .setLabel('Max. Spieler (optional)')
        .setPlaceholder('z.B. 4, 8, 16 – leer lassen, falls egal')
        .setRequired(false)
        .setMaxLength(10)
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(isFreeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          maxPlayersInput,
        ),
      );

      await interaction.showModal(modal);
      return;
    }

    if (customId === 'poll_montag_remove_game') {
      await interaction.reply({
        content:
          'Das Deaktivieren von Spielen läuft derzeit über die Datenbank (Flag `isActive`).',
        ephemeral: true,
      });
      return;
    }

    if (customId === 'poll_montag_toggle_multiselect') {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.allowMultiselect = !state.allowMultiselect;

      const gameCount = await ermittleGesamtGameCount();

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_duration_dec') {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.max(1, state.durationHours - 1);

      const gameCount = await ermittleGesamtGameCount();

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_duration_inc') {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.min(32 * 24, state.durationHours + 1);

      const gameCount = await ermittleGesamtGameCount();

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    // 3) Preview-Buttons
    if (customId === 'poll_montag_preview_back') {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = getOrInitSetupState(guildId, userId);
      const gameCount = await ermittleGesamtGameCount();

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_reroll') {
      const ok = await checkPermissions();
      if (!ok) return;

      const state = await prepareRandomGamesForState(guildId, userId);

      const { embed, components } = baueMontagPreviewView({
        serverName,
        nextMontagText,
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_cancel') {
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

    // 4) „Umfrage schließen“-Button für laufenden Poll
    if (customId === 'poll_montag_close_active') {
      const ok = await checkPermissions();
      if (!ok) return;

      const aktiverPoll = await findeAktivenMontagPoll(guildId);

      if (!aktiverPoll) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('Keine aktive Montags-Umfrage')
              .setDescription('Es ist aktuell keine Montags-Runde-Umfrage aktiv.')
              .setColor(0xed4245),
          ],
          components: [],
        });
        return;
      }

      try {
        const channel = await guild.channels.fetch(aktiverPoll.channelId);
        if (!channel || !channel.isTextBased()) {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle('Poll-Channel nicht gefunden')
                .setDescription(
                  'Ich konnte den Poll-Channel nicht laden. Vielleicht wurde der Channel oder die Nachricht gelöscht?',
                )
                .setColor(0xed4245),
            ],
            components: [],
          });
          return;
        }

        const textChannel = channel as GuildTextBasedChannel;
        const message = await textChannel.messages.fetch(aktiverPoll.messageId);

        // Poll im Client beenden (keine weiteren Stimmen)
        if (message.poll) {
          const anyPoll: any = message.poll;
          if (anyPoll.end && typeof anyPoll.end === 'function') {
            await anyPoll.end();
          }
        }

        // Poll in der DB als beendet markieren (unabhängig vom Gewinner)
        await beendeMontagPoll(aktiverPoll.id);

        // Versuch, das Ergebnis auszulesen
        const ergebnis = ermittlePollGewinnerAusMessage(message);
        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

        if (!ergebnis || !ergebnis.topAnswers.length) {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle('Montags-Umfrage geschlossen')
                .setDescription(
                  [
                    'Die aktive Montags-Runde-Umfrage wurde beendet.',
                    '',
                    'Es konnten keine gültigen Stimmen ermittelt werden.',
                    '',
                    `🔗 [Zur ehemaligen Umfrage](${pollUrl})`,
                  ].join('\n'),
                )
                .setColor(0xed4245),
            ],
            components: [],
          });

          return;
        }

        if (ergebnis.topAnswers.length === 1) {
          // eindeutiger Gewinner
          const winner = ergebnis.topAnswers[0];
          const { game } = await setMontagWinner({
            pollId: aktiverPoll.id,
            winnerGameName: winner.text,
          });

          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle('Montags-Umfrage geschlossen')
                .setDescription(
                  [
                    'Die aktive Montags-Runde-Umfrage wurde beendet.',
                    '',
                    `🎉 Gewonnen hat: **${winner.text}**`,
                    game
                      ? `(_${game.isFree ? 'kostenlos' : 'kostenpflichtig'} • max. ${
                          game.maxPlayers ?? 'unbegrenzt'
                        } Spieler_)`
                      : '',
                    '',
                    `🔗 [Zur ehemaligen Umfrage](${pollUrl})`,
                  ]
                    .filter((line) => line.length > 0)
                    .join('\n'),
                )
                .setColor(0x57f287),
            ],
            components: [],
          });

          logInfo('Montags-Poll geschlossen (eindeutiger Gewinner)', {
            functionName: 'handleMontagPollButton',
            guildId,
            userId,
            extra: {
              pollId: aktiverPoll.id,
              winnerName: winner.text,
            },
          });

          return;
        }

        // Gleichstand → Kandidaten merken + Button zum Zufalls-Gewinner
        const winnerNames = ergebnis.topAnswers.map(
          (a: SimplePollAnswer) => a.text,
        );
        tieCandidatesPerPoll.set(aktiverPoll.id, winnerNames);

        const winnerList = winnerNames.map((n: string) => `• ${n}`).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('Montags-Umfrage geschlossen – Gleichstand')
          .setDescription(
            [
              'Die aktive Montags-Runde-Umfrage wurde beendet.',
              '',
              'Folgende Spiele haben gleich viele Stimmen:',
              winnerList,
              '',
              'Klicke auf **„Zufalls-Gewinner ziehen“**, um einen Gewinner festzulegen.',
              '',
              `🔗 [Zur ehemaligen Umfrage](${pollUrl})`,
            ].join('\n'),
          )
          .setColor(0xfee75c);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_montag_pick_winner_${aktiverPoll.id}`)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Zufalls-Gewinner ziehen'),
        );

        await interaction.update({
          embeds: [embed],
          components: [row],
        });

        logInfo('Montags-Poll geschlossen (Gleichstand)', {
          functionName: 'handleMontagPollButton',
          guildId,
          userId,
          extra: {
            pollId: aktiverPoll.id,
            candidates: winnerNames,
          },
        });

        return;
      } catch (error) {
        logError('Fehler beim Schließen des Montags-Polls', {
          functionName: 'handleMontagPollButton',
          guildId,
          userId,
          extra: { error, customId },
        });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              'Beim Schließen der Umfrage ist etwas schiefgelaufen. Schau bitte in die Logs.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              'Beim Schließen der Umfrage ist etwas schiefgelaufen. Schau bitte in die Logs.',
            ephemeral: true,
          });
        }

        return;
      }
    }

    // 4b) Gleichstand auflösen: Zufalls-Gewinner ziehen
    if (customId.startsWith('poll_montag_pick_winner_')) {
      const ok = await checkPermissions();
      if (!ok) return;

      const pollId = customId.substring('poll_montag_pick_winner_'.length);

      const candidates = tieCandidatesPerPoll.get(pollId);

      if (!candidates || !candidates.length) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('Keine Gleichstandsdaten gefunden')
              .setDescription(
                'Ich habe keine gespeicherten Kandidaten mehr. Bitte wähle manuell einen Gewinner aus.',
              )
              .setColor(0xed4245),
          ],
          components: [],
        });
        return;
      }

      // Einmal verwenden, dann verwerfen
      tieCandidatesPerPoll.delete(pollId);

      const winnerName =
        candidates[Math.floor(Math.random() * candidates.length)];

      const { poll, game } = await setMontagWinner({
        pollId,
        winnerGameName: winnerName,
      });

      const pollUrl = `https://discord.com/channels/${poll.guildId}/${poll.channelId}/${poll.messageId}`;

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle('Montags-Umfrage – Gewinner gezogen')
            .setDescription(
              [
                'Der Gleichstand wurde per Zufall aufgelöst.',
                '',
                `🎉 Gewinner: **${winnerName}**`,
                game
                  ? `(_${game.isFree ? 'kostenlos' : 'kostenpflichtig'} • max. ${
                      game.maxPlayers ?? 'unbegrenzt'
                    } Spieler_)`
                  : '',
                '',
                `🔗 [Zur Umfrage](${pollUrl})`,
              ]
                .filter((line) => line.length > 0)
                .join('\n'),
            )
            .setColor(0x57f287),
        ],
        components: [],
      });

      logInfo('Gleichstand per Zufalls-Gewinner aufgelöst', {
        functionName: 'handleMontagPollButton',
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
    if (customId === 'poll_montag_start') {
      const ok = await checkPermissions();
      if (!ok) return;

      const aktiverPoll = await findeAktivenMontagPoll(guildId);
      if (aktiverPoll) {
        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('Montags-Runde läuft bereits')
              .setDescription(
                [
                  'Es gibt bereits einen aktiven Montags-Poll auf diesem Server.',
                  '',
                  `🔗 [Zur laufenden Abstimmung](${pollUrl})`,
                ].join('\n'),
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
            'Es sind noch keine Spiele ausgewählt. Bitte zuerst "Umfrage vorbereiten" drücken.',
          ephemeral: true,
        });
        return;
      }

      const channelRaw = interaction.channel ?? guild.systemChannel;

      if (!channelRaw || !channelRaw.isTextBased()) {
        await interaction.reply({
          content:
            'Kein gültiger Ziel-Channel gefunden, in dem der Poll erstellt werden kann.',
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
            'Der native Poll konnte nicht erstellt werden. Prüfe bitte die Berechtigungen von M.E.A.T. im Ziel-Channel.',
          ephemeral: true,
        });
        return;
      }

      try {
        if (message.pinnable && !message.pinned) {
          await message.pin();
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

      logInfo('Montags-Poll erstellt', {
        functionName: 'handleMontagPollButton',
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
                '📢 **Neue Montags-Runde Umfrage gestartet!**',
                '',
                `🔗 [Zur Abstimmung](${pollUrl})`,
              ].join('\n'),
            });
          }
        } catch {
          // nice-to-have
        }
      }

      resetSetupState(guildId, userId);

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle('Montags-Runde – Poll gestartet')
            .setDescription(
              [
                'Der **native Discord-Poll** für die Montags-Runde wurde erstellt.',
                '',
                `🔗 [Zum Poll springen](${pollUrl})`,
                '',
                'Die Nachricht im Channel wurde (sofern möglich) angepinnt.',
              ].join('\n'),
            )
            .setColor(0x57f287),
        ],
        components: [],
      });

      return;
    }

    // Fallback
    await interaction.reply({
      content: 'Dieser Montags-Button wird noch nicht unterstützt.',
      ephemeral: true,
    });
  } catch (error) {
    const guildIdSafe = interaction.guildId ?? 'unknown';

    logError('Fehler im Montags-Poll-Flow', {
      functionName: 'handleMontagPollButton',
      guildId: guildIdSafe,
      userId,
      extra: { error, customId },
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          'Uff. Beim Montags-Poll ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          'Uff. Beim Montags-Poll ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
        ephemeral: true,
      });
    }
  }
}
