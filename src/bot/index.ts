// FILE: src/bot/index.ts

import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  type Interaction,
  type ButtonInteraction,
} from 'discord.js';
import { slashCommands } from './commands/index.js';
import { logError, logInfo, logWarn } from './general/logging/logger.js';
import { trackCommandUsage } from './general/stats/statsManager.js';
import { bearbeiteDatenschutzButton } from './functions/sentinel/datenschutz/datenschutz.buttons.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  logError('Kein DISCORD_TOKEN in der .env gefunden.', {
    functionName: 'bootstrap',
  });
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // für Slash-Commands & Guild-Funktionen
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  logInfo(`Eingeloggt als ${readyClient.user.tag}`, {
    functionName: 'clientReady',
  });
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    // 1) Slash-Commands
    if (interaction.isChatInputCommand()) {
      const command = slashCommands.get(interaction.commandName);
      if (!command) {
        logWarn(`Unbekannter Command: /${interaction.commandName}`, {
          functionName: 'interaction',
          guildId: interaction.guildId ?? undefined,
          channelId: interaction.channelId,
          userId: interaction.user.id,
          commandName: interaction.commandName,
        });
        return;
      }

      logInfo(`Starte Command /${interaction.commandName}`, {
        functionName: 'interaction',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        commandName: interaction.commandName,
      });

      await command.execute(interaction);

      // Nach erfolgreicher Ausführung: Stats-Tracking
      await trackCommandUsage(interaction);

      logInfo(`Command /${interaction.commandName} erfolgreich beendet`, {
        functionName: 'interaction',
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        commandName: interaction.commandName,
      });

      return;
    }

    // 2) Buttons
    if (interaction.isButton()) {
      const buttonInteraction = interaction as ButtonInteraction;

      if (buttonInteraction.customId.startsWith('sentinel_datenschutz_')) {
        await bearbeiteDatenschutzButton(buttonInteraction);
        return;
      }

      // andere Button-Typen kommen später hierhin
      return;
    }

    // Weitere Interaktionstypen (Modals etc.) später
  } catch (error) {
    logError('Fehler im Interaction-Handler', {
      functionName: 'interactionRoot',
      extra: { error },
    });

    if (interaction.isRepliable() && !(interaction as any).replied) {
      try {
        await interaction.reply({
          content:
            'Uff. Irgendetwas ist im Interaktions-Handler schiefgelaufen. Bitte versuche es später erneut.',
          ephemeral: true,
        });
      } catch {
        // Ignorieren
      }
    }
  }
});

client
  .login(token)
  .catch((err) => {
    logError('Login-Fehler beim Client', {
      functionName: 'bootstrap',
      extra: { error: err },
    });
    process.exit(1);
  });
