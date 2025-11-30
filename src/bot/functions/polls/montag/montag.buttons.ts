// FILE: src/bot/functions/polls/montag/montag.buttons.ts

import {
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
  getGesamtGameCount,
  getOrInitSetupState,
  getSetupState,
  prepareRandomGamesForState,
  resetSetupState,
} from './montag.service.js';
import { bauePollCenterView } from '../poll.embeds.js';
import {
  logError,
  logInfo,
} from '../../../general/logging/logger.js';
import { ladeServerEinstellungen } from '../../../general/config/server-settings-loader.js';

function ermittleNaechstenMontag19Uhr(): string {
  const jetzt = new Date();
  const tag = jetzt.getDay(); // 0 = So, 1 = Mo, ...
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
  const guild = interaction.guild;
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId || !guild) {
    await interaction.reply({
      content: 'Die Montags-Runde kann nur auf einem Server verwendet werden.',
      ephemeral: true,
    });
    return;
  }

  const customId = interaction.customId;
  const serverName = guild.name;
  const nextMontagText = ermittleNaechstenMontag19Uhr();

  try {
    // 1) Einstieg aus dem Poll-Center
    if (customId === 'poll_type_montag') {
      const state = getOrInitSetupState(guildId, userId);

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount: getGesamtGameCount(),
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    // 2) Setup-View Buttons
    if (customId === 'poll_montag_prepare') {
      const state = prepareRandomGamesForState(guildId, userId);

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
          'Das Hinzufügen neuer Spiele wird später über ein Modal + Datenbank angebunden. Aktuell nutzt M.E.A.T. eine Dummy-Liste.',
        ephemeral: true,
      });
      return;
    }

    if (customId === 'poll_montag_remove_game') {
      await interaction.reply({
        content:
          'Das Entfernen/Deaktivieren von Spielen wird später über eine Datenbank umgesetzt. Diese Version ist nur das UI-Gerüst.',
        ephemeral: true,
      });
      return;
    }

    if (customId === 'poll_montag_toggle_multiselect') {
      const state = getOrInitSetupState(guildId, userId);
      state.allowMultiselect = !state.allowMultiselect;

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount: getGesamtGameCount(),
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_duration_dec') {
      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.max(1, state.durationHours - 1);

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount: getGesamtGameCount(),
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_duration_inc') {
      const state = getOrInitSetupState(guildId, userId);
      state.durationHours = Math.min(32 * 24, state.durationHours + 1);

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount: getGesamtGameCount(),
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    // 3) Preview-View Buttons

    if (customId === 'poll_montag_preview_back') {
      const state = getOrInitSetupState(guildId, userId);

      const { embed, components } = baueMontagSetupView({
        serverName,
        nextMontagText,
        gameCount: getGesamtGameCount(),
        state,
      });

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_reroll') {
      const state = prepareRandomGamesForState(guildId, userId);

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
      resetSetupState(guildId, userId);
      const { embed, components } = bauePollCenterView(serverName);

      await interaction.update({
        embeds: [embed],
        components,
      });

      return;
    }

    if (customId === 'poll_montag_start') {
      const state = getSetupState(guildId, userId);

      if (!state || !state.selectedGames.length) {
        await interaction.reply({
          content:
            'Es sind noch keine Spiele ausgewählt. Bitte zuerst "Umfrage vorbereiten" drücken.',
          ephemeral: true,
        });
        return;
      }

      const zielChannel = interaction.channel ?? guild.systemChannel;

      if (!zielChannel) {
        await interaction.reply({
          content:
            'Kein gültiger Ziel-Channel gefunden, in dem der Poll erstellt werden kann.',
          ephemeral: true,
        });
        return;
      }

      const sendChannel = zielChannel as GuildTextBasedChannel;

      const questionText = `Was zocken wir in der Montags-Runde am ${nextMontagText}?`;

      const message = await createNativeMontagPoll({
        channel: sendChannel,
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

      // Poll-Nachricht pinnen (nice-to-have)
      try {
        if (message.pinnable && !message.pinned) {
          await message.pin();
        }
      } catch {
        // ignore
      }

      const pollUrl = message.url;

      logInfo('Montags-Poll erstellt', {
        functionName: 'handleMontagPollButton',
        guildId,
        channelId: message.channelId,
        userId,
        extra: {
          pollUrl,
          durationHours: state.durationHours,
          allowMultiselect: state.allowMultiselect,
          selectedGames: state.selectedGames.map((g) => g.name),
        },
      });

      // 📣 Ankündigung in Announcement-Channel (falls konfiguriert)
      try {
        const settings = await ladeServerEinstellungen(guildId);
        const announcementChannelId =
          settings.functions.polls?.montag?.spezifisch?.announcementChannelId ??
          null;

        if (announcementChannelId) {
          const announceChannel = guild.channels.cache.get(
            announcementChannelId,
          );

          if (announceChannel && 'send' in announceChannel) {
            await (announceChannel as GuildTextBasedChannel).send({
              content: `🕹️ **Montags-Runde – neue Abstimmung!**\nStimmt hier ab: ${pollUrl}`,
            });
          }
        }
      } catch (error) {
        logError('Fehler beim Senden der Montags-Poll-Ankündigung', {
          functionName: 'handleMontagPollButton',
          guildId,
          userId,
          extra: { error },
        });
      }

      // Setup-State zurücksetzen
      resetSetupState(guildId, userId);

      // Ephemere Steuer-Nachricht updaten
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
