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
  type Guild,
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
  ermittleAusgeschlosseneGewinner,
  ermittleMontagPollErgebnis,
  getOrInitSetupState,
  getSetupState,
  prepareRandomGamesForState,
  resetSetupState,
} from './montag.service.js';
import { bauePollCenterView } from '../poll.embeds.js';
import {
  beendeMontagPoll,
  findeAktivenMontagPoll,
  findeMontagPollByMessage,
  findeLetztenMontagPoll,
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
  const tagNum = ziel.getDate().toString().padStart(2, '0');
  const monatNum = (ziel.getMonth() + 1).toString().padStart(2, '0');

  return `${wt}, ${tagNum}.${monatNum}. um 19:00 Uhr`;
}

// Merkt sich bei Gleichstand die Kandidaten pro Poll,
// damit wir spÃ¤ter per Button einen Zufalls-Gewinner ziehen kÃ¶nnen.
const tieCandidatesPerPoll = new Map<string, string[]>();
const closingPollIds = new Set<string>();

async function sendeMontagErgebnisNachricht(params: {
  guild: Guild;
  pollChannelId: string;
  announcementChannelId: string | null;
  embed: EmbedBuilder;
  components?: ActionRowBuilder<ButtonBuilder>[];
}): Promise<void> {
  const {
    guild,
    pollChannelId,
    announcementChannelId,
    embed,
    components = [],
  } = params;

  try {
    const pollChannel = await guild.channels.fetch(pollChannelId);
    if (pollChannel && pollChannel.isTextBased()) {
      await pollChannel.send({ embeds: [embed], components });
    }
  } catch (error) {
    logError('Konnte Montags-Ergebnis nicht in Poll-Channel senden', {
      functionName: 'sendeMontagErgebnisNachricht',
      guildId: guild.id,
      extra: { pollChannelId, announcementChannelId, error },
    });
  }

  if (
    announcementChannelId &&
    announcementChannelId !== pollChannelId
  ) {
    try {
      const announcementChannel = await guild.channels.fetch(
        announcementChannelId,
      );
      if (announcementChannel && announcementChannel.isTextBased()) {
        await announcementChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      logError('Konnte Montags-Ergebnis nicht im Announcement-Channel senden', {
        functionName: 'sendeMontagErgebnisNachricht',
        guildId: guild.id,
        extra: { pollChannelId, announcementChannelId, error },
      });
    }
  }
}

async function entfernePinHinweis(
  channel: GuildTextBasedChannel,
  pinnedMessageId: string,
): Promise<void> {
  try {
    const recent = await channel.messages.fetch({ limit: 5 });
    for (const [, msg] of recent) {
      if (
        msg.type === 6 && // MessageType.ChannelPinnedMessage
        (msg.reference?.messageId === pinnedMessageId ||
          msg.content.includes(pinnedMessageId))
      ) {
        await msg.delete().catch(() => {});
        break;
      }
    }
  } catch {
    // nicht kritisch
  }
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
          .setTitle('Montags-Runde â€“ Umfrage lÃ¤uft bereits')
          .setDescription(
            [
              'Es gibt bereits eine aktive Umfrage fÃ¼r die Montags-Runde.',
              '',
              `ðŸ”— [Zur laufenden Abstimmung](${pollUrl})`,
              '',
              'Du kannst die Umfrage hier auch direkt schlieÃŸen.',
            ].join('\n'),
          )
          .setColor(0xfee75c);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('poll_montag_close_active')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Umfrage schlieÃŸen'),
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

    // "Spiel hinzufÃ¼gen" â†’ Modal Ã¶ffnen
    if (customId === 'poll_montag_add_game') {
      const ok = await checkPermissions();
      if (!ok) return;

      const modal = new ModalBuilder()
        .setCustomId('poll_montag_add_game_modal')
        .setTitle('Neues Spiel â€“ Montags-Runde');

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
        .setPlaceholder('z.B. 4, 8, 16 â€“ leer lassen, falls egal')
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

    if (customId === 'poll_montag_toggle_multiselect') {
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

    if (customId === 'poll_montag_duration_dec') {
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

    if (customId === 'poll_montag_duration_inc') {
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
    if (customId === 'poll_montag_preview_back') {
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

    // 4) â€žUmfrage schlieÃŸenâ€œ-Button fÃ¼r laufenden Poll
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
        closingPollIds.add(aktiverPoll.id);

        await interaction.deferUpdate();

        const channel = await guild.channels.fetch(aktiverPoll.channelId);
        if (!channel || !channel.isTextBased()) {
          await interaction.followUp({
            content:
              'Poll-Channel nicht gefunden. Vielleicht wurde der Channel oder die Nachricht gelÃ¶scht?',
            ephemeral: true,
          });
          return;
        }

        const textChannel = channel as GuildTextBasedChannel;
        const message = await textChannel.messages.fetch(aktiverPoll.messageId);

        let pollAny = message.poll as any;

        // Poll manuell beenden, falls mÃ¶glich
        if (pollAny && typeof pollAny.end === 'function') {
          try {
            await pollAny.end();
            const refreshed = await message.fetch();
            pollAny = (refreshed.poll ?? message.poll) as any;
          } catch (err: any) {
            const code = err?.code ?? err?.rawError?.code;
            if (code === 520001) {
              // Poll schon abgelaufen â†’ trotzdem Ergebnis lesen
              logInfo('Montags-Poll war beim SchlieÃŸen bereits abgelaufen', {
                functionName: 'handleMontagPollButton',
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
          // answers kann eine Collection oder ein Array sein
          const rawAnswers = pollAny?.answers;
          const answers: any[] =
            rawAnswers && typeof rawAnswers.map === 'function'
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
                    '',
                ).trim(),
              )
              .filter((name) => name.length > 0);
          }

          // Debug-Log, falls nochmal was komisch ist
          logInfo('Montags-Poll Ergebnis ausgewertet', {
            functionName: 'handleMontagPollButton',
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
          logError('Konnte Montags-Poll-Ergebnis nicht auslesen', {
            functionName: 'handleMontagPollButton',
            guildId,
            userId,
            extra: { error: err, pollId: aktiverPoll.id },
          });
        }

        // Poll in der DB als beendet markieren (unabhÃ¤ngig vom Gewinner)
        await beendeMontagPoll(aktiverPoll.id);

        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

                // Fall 1: keine Stimmen / kein Ergebnis lesbar
        if (!winnerNames.length) {
          const embed = new EmbedBuilder()
            .setTitle('Montags-Umfrage geschlossen')
            .setDescription(
              [
                'Die aktive Montags-Runde-Umfrage wurde beendet.',
                '',
                'Es konnten keine gültigen Stimmen ermittelt werden.',
              ].join('\n'),
            )
            .setColor(0xed4245);

          const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel('Zur Umfrage')
              .setURL(pollUrl),
          );

          await sendeMontagErgebnisNachricht({
            guild,
            pollChannelId: aktiverPoll.channelId,
            announcementChannelId: null,
            embed,
            components: [linkRow],
          });

          await interaction.message?.delete().catch(() => {});

          return;
        }
        // Fall 2: eindeutiger Gewinner
        if (winnerNames.length === 1) {
                const winnerName =
        candidates[Math.floor(Math.random() * candidates.length)];

      const { poll, game } = await setMontagWinner({
        pollId,
        winnerGameName: winnerName,
      });

      const pollUrl = `https://discord.com/channels/${poll.guildId}/${poll.channelId}/${poll.messageId}`;

      const embed = new EmbedBuilder()
        .setTitle('Montags-Umfrage – Gewinner gezogen')
        .setDescription(
          [
            'Der Gleichstand wurde per Zufall aufgelöst.',
            '',
            `Gewinner: **${winnerName}**`,
            game
              ? `(_${game.isFree ? 'kostenlos' : 'kostenpflichtig'} - max. ${
                  game.maxPlayers ?? 'unbegrenzt'
                } Spieler_)`
              : '',
          ]
            .filter((line) => line.length > 0)
            .join('\\n'),
        )
        .setColor(0x57f287);

      const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Zur Umfrage')
          .setURL(pollUrl),
      );

      await interaction.deferUpdate();

      await sendeMontagErgebnisNachricht({
        guild,
        pollChannelId: poll.channelId,
        announcementChannelId,
        embed,
        components: [linkRow],
      });

      await interaction.message?.delete().catch(() => {});
logInfo('Gleichstand per Zufalls-Gewinner aufgelÃ¶st', {
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
              .setTitle('Montags-Runde lÃ¤uft bereits')
              .setDescription(
                [
                  'Es gibt bereits einen aktiven Montags-Poll auf diesem Server.',
                  '',
                  `ðŸ”— [Zur laufenden Abstimmung](${pollUrl})`,
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
            'Es sind noch keine Spiele ausgewÃ¤hlt. Bitte zuerst "Umfrage vorbereiten" drÃ¼cken.',
          ephemeral: true,
        });
        return;
      }

      const channelRaw = interaction.channel ?? guild.systemChannel;

      if (!channelRaw || !channelRaw.isTextBased()) {
        await interaction.reply({
          content:
            'Kein gÃ¼ltiger Ziel-Channel gefunden, in dem der Poll erstellt werden kann.',
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
            'Der native Poll konnte nicht erstellt werden. PrÃ¼fe bitte die Berechtigungen von M.E.A.T. im Ziel-Channel.',
          ephemeral: true,
        });
        return;
      }

      try {
        if (message.pinnable && !message.pinned) {
          await message.pin();
          await entfernePinHinweis(zielChannel, message.id);
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

      // Vor neuem Pin: alten Montags-Poll (falls vorhanden) im gleichen Guild/Channel entpinnen
      try {
        const letzterPoll = await findeLetztenMontagPoll(
          guildId,
          message.id,
        );
        if (
          letzterPoll &&
          letzterPoll.channelId === message.channelId
        ) {
          const oldMessage = await zielChannel.messages
            .fetch(letzterPoll.messageId)
            .catch(() => null);
          if (oldMessage?.pinned) {
            await oldMessage.unpin().catch(() => {});
          }
        }
      } catch {
        // nice-to-have, Fehler ignorieren
      }

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
                'ðŸ“¢ **Neue Montags-Runde Umfrage gestartet!**',
                '',
                `ðŸ”— [Zur Abstimmung](${pollUrl})`,
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
            .setTitle('Montags-Runde â€“ Poll gestartet')
            .setDescription(
              [
                'Der **native Discord-Poll** fÃ¼r die Montags-Runde wurde erstellt.',
                '',
                `ðŸ”— [Zum Poll springen](${pollUrl})`,
                '',
                'Die Nachricht im Channel wurde (sofern mÃ¶glich) angepinnt.',
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
      content: 'Dieser Montags-Button wird noch nicht unterstÃ¼tzt.',
      ephemeral: true,
    });
  } catch (error) {
    logError('Fehler im Montags-Poll-Flow', {
      functionName: 'handleMontagPollButton',
      guildId,
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

export async function handleAutoEndedMontagPoll(
  message: Message,
): Promise<void> {
  const pollRecord = await findeMontagPollByMessage(message.id);
  if (!pollRecord) return;

  if (closingPollIds.has(pollRecord.id)) {
    // Wird gerade manuell geschlossen â€“ Auto-Ende Ã¼berspringen
    return;
  }

  let currentMessage = message;

  if (currentMessage.partial || !currentMessage.poll) {
    try {
      currentMessage = await currentMessage.fetch();
    } catch (error) {
      logError('Konnte Montags-Poll-Nachricht nicht nachladen', {
        functionName: 'handleAutoEndedMontagPoll',
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
    (typeof pollData.expiresTimestamp === 'number' &&
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

    if (!winnerNames.length) {
    const embed = new EmbedBuilder()
      .setTitle('Montags-Umfrage geschlossen')
      .setDescription(
        [
          'Die aktive Montags-Runde-Umfrage wurde beendet.',
          '',
          'Es konnten keine gültigen Stimmen ermittelt werden.',
        ].join('\n'),
      )
      .setColor(0xed4245);

    const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('Zur Umfrage')
        .setURL(pollUrl),
    );

    await sendeMontagErgebnisNachricht({
      guild,
      pollChannelId: pollRecord.channelId,
      announcementChannelId: null,
      embed,
      components: [linkRow],
    });

    logInfo('Montags-Poll automatisch beendet (keine Stimmen)', {
      functionName: 'handleAutoEndedMontagPoll',
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
      .setTitle('Montags-Umfrage geschlossen')
      .setDescription(
        [
          'Die aktive Montags-Runde-Umfrage wurde beendet.',
          '',
          `Gewonnen hat: **${winnerName}**`,
          game
            ? `(_${game.isFree ? 'kostenlos' : 'kostenpflichtig'} - max. ${
                game.maxPlayers ?? 'unbegrenzt'
              } Spieler_)`
            : '',
        ]
          .filter((line) => line.length > 0)
          .join('\\n'),
      )
      .setColor(0x57f287);

    const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('Zur Umfrage')
        .setURL(pollUrl),
    );

    await sendeMontagErgebnisNachricht({
      guild,
      pollChannelId: pollRecord.channelId,
      announcementChannelId,
      embed,
      components: [linkRow],
    });

    logInfo('Montags-Poll automatisch beendet (Gewinner)', {
      functionName: 'handleAutoEndedMontagPoll',
      guildId: pollRecord.guildId,
      extra: { pollId: pollRecord.id, winnerName, answersDebug },
    });

    return;
  }

  tieCandidatesPerPoll.set(pollRecord.id, winnerNames);tieCandidatesPerPoll.set(pollRecord.id, winnerNames);

    const winnerList = winnerNames.map((n) => `• ${n}`).join('\\n');

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
      ].join('\\n'),
    )
    .setColor(0xfee75c);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`poll_montag_pick_winner_${pollRecord.id}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel('Zufalls-Gewinner ziehen'),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Zur Umfrage')
      .setURL(pollUrl),
  );

  await sendeMontagErgebnisNachricht({
    guild,
    pollChannelId: pollRecord.channelId,
    announcementChannelId: null,
    embed,
    components: [row],
  });
logInfo('Montags-Poll automatisch beendet (Gleichstand)', {
    functionName: 'handleAutoEndedMontagPoll',
    guildId: pollRecord.guildId,
    extra: { pollId: pollRecord.id, candidates: winnerNames, answersDebug },
  });
}









