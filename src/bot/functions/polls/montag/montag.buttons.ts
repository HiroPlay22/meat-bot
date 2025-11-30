// FILE: src/bot/functions/polls/montag/montag.buttons.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
  type GuildTextBasedChannel,
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

  // ServerSettings (inkl. Rollen & Announcement-Channel)
  const settings = await ladeServerEinstellungen(guildId);
  const montagSettings = settings.functions.polls?.montag;
  const spezifisch = montagSettings?.spezifisch;
  const allowedRoleIds = spezifisch?.allowedRoleIds ?? [];
  const announcementChannelId = spezifisch?.announcementChannelId ?? null;

  try {
    async function checkPermissions(): Promise<boolean> {
      // Wenn keine Rollen konfiguriert sind → jeder darf
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
            .setLabel('Zum Poll')
            .setStyle(ButtonStyle.Link)
            .setURL(pollUrl),
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

    if (customId === 'poll_montag_add_game') {
      await interaction.reply({
        content:
          'Das Hinzufügen neuer Spiele läuft später über ein Modal. Aktuell bitte per DB (z.B. Prisma Studio) pflegen.',
        ephemeral: true,
      });
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
              .setDescription(
                'Es ist aktuell keine Montags-Runde-Umfrage aktiv.',
              )
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

        if (message.poll) {
          const anyPoll = message.poll as any;
          if (anyPoll.end && typeof anyPoll.end === 'function') {
            await anyPoll.end();
          }
        }

        await beendeMontagPoll(aktiverPoll.id);

        const pollUrl = `https://discord.com/channels/${guildId}/${aktiverPoll.channelId}/${aktiverPoll.messageId}`;

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('Montags-Umfrage geschlossen')
              .setDescription(
                [
                  'Die aktive Montags-Runde-Umfrage wurde beendet.',
                  '',
                  `🔗 [Zur ehemaligen Umfrage](${pollUrl})`,
                ].join('\n'),
              )
              .setColor(0x57f287),
          ],
          components: [],
        });

        logInfo('Montags-Poll über Button geschlossen', {
          functionName: 'handleMontagPollButton',
          guildId,
          userId,
          extra: {
            pollId: aktiverPoll.id,
            messageId: aktiverPoll.messageId,
            channelId: aktiverPoll.channelId,
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

      // Announcement-Channel pingen (wenn konfiguriert)
      if (announcementChannelId && announcementChannelId !== message.channelId) {
        try {
          const announceChannel = await guild.channels.fetch(
            announcementChannelId,
          );
          if (announceChannel && announceChannel.isTextBased()) {
            const announceTextChannel =
              announceChannel as GuildTextBasedChannel;
            await announceTextChannel.send({
              content: [
                '📢 **Neue Montags-Runde Umfrage gestartet!**',
                '',
                `🔗 [Zur Abstimmung](${pollUrl})`,
              ].join('\n'),
            });
          }
        } catch {
          // nice-to-have, kein Hard-Fail
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
