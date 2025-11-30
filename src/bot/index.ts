// FILE: src/bot/index.ts

import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  type Interaction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import { slashCommands } from './commands/index.js';
import {
  logError,
  logInfo,
  logWarn,
  setDiscordClient,
} from './general/logging/logger.js';
import { trackCommandUsage } from './general/stats/statsManager.js';
import { handleStatsButtonInteraction } from './functions/stats/overview/stats.buttons.js';
import { bearbeiteDatenschutzButton } from './functions/sentinel/datenschutz/datenschutz.buttons.js';
import { handlePollButtonInteraction } from './functions/polls/poll.buttons.js';
import { handleMontagAddGameModal } from './functions/polls/montag/montag.modals.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  logError('Kein DISCORD_TOKEN in der .env gefunden.', {
    functionName: 'bootstrap',
  });
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Discord-Client dem Logger bekannt machen
setDiscordClient(client);

client.once(Events.ClientReady, (readyClient) => {
  logInfo(`Eingeloggt als ${readyClient.user.tag}`, {
    functionName: 'clientReady',
  });
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  // 🔹 Slash-Commands
  if (interaction.isChatInputCommand()) {
    const command = slashCommands.get(interaction.commandName);
    if (!command) {
      logWarn(`Unbekannter Command: /${interaction.commandName}`, {
        functionName: 'interaction',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId ?? undefined, // <- FIX
        userId: interaction.user.id,
        commandName: interaction.commandName,
      });
      return;
    }

    logInfo(`Starte Command /${interaction.commandName}`, {
      functionName: 'interaction',
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId ?? undefined, // <- FIX
      userId: interaction.user.id,
      commandName: interaction.commandName,
    });

    try {
      await command.execute(interaction);
      await trackCommandUsage(interaction);

      logInfo(`Command /${interaction.commandName} erfolgreich beendet`, {
        functionName: 'interaction',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId ?? undefined, // <- FIX
        userId: interaction.user.id,
        commandName: interaction.commandName,
      });
    } catch (error) {
      logError(`Fehler bei /${interaction.commandName}`, {
        functionName: 'interaction',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId ?? undefined, // <- FIX
        userId: interaction.user.id,
        commandName: interaction.commandName,
        extra: { error },
      });

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              'Uff. Da ist was schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              'Uff. Da ist was schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
            ephemeral: true,
          });
        }
      } catch {
        // ignorieren
      }
    }

    return;
  }

  // 🔹 Buttons
  if (interaction.isButton()) {
    const buttonInteraction = interaction as ButtonInteraction;
    const customId = buttonInteraction.customId;

    try {
      // 1) Sentinel / Datenschutz
      if (customId.startsWith('sentinel_datenschutz_')) {
        await bearbeiteDatenschutzButton(buttonInteraction);
        return;
      }

      // 2) Poll-System (inkl. Montags-Runde)
      if (customId.startsWith('poll_') || customId === 'poll_type_montag') {
        await handlePollButtonInteraction(buttonInteraction);
        return;
      }

      // 3) Stats / andere Buttons
      await handleStatsButtonInteraction(buttonInteraction);
      return;
    } catch (error) {
      logError('Fehler bei der Button-Verarbeitung', {
        functionName: 'interactionButton',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId ?? undefined, // <- FIX
        userId: interaction.user.id,
        extra: { error, customId },
      });

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              'Uff. Da ist was bei einem Button schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              'Uff. Da ist was bei einem Button schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
            ephemeral: true,
          });
        }
      } catch {
        // ignorieren
      }
    }

    return;
  }

  // 🔹 Modals (z.B. "Spiel hinzufügen" für Montags-Runde)
  if (interaction.isModalSubmit()) {
    const modalInteraction = interaction as ModalSubmitInteraction;
    const customId = modalInteraction.customId;

    try {
      if (customId === 'poll_montag_add_game_modal') {
        await handleMontagAddGameModal(modalInteraction);
        return;
      }

      // hier später weitere Modals einhängen
    } catch (error) {
      logError('Fehler bei der Modal-Verarbeitung', {
        functionName: 'interactionModal',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId ?? undefined, // <- FIX
        userId: interaction.user.id,
        extra: { error, customId },
      });

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              'Uff. Beim Verarbeiten des Formulars ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              'Uff. Beim Verarbeiten des Formulars ist etwas schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
            ephemeral: true,
          });
        }
      } catch {
        // ignorieren
      }
    }

    return;
  }
});

client.login(token).catch((err) => {
  logError('Login-Fehler beim Client', {
    functionName: 'bootstrap',
    extra: { error: err },
  });
  process.exit(1);
});
