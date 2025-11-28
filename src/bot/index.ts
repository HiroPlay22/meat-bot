// FILE: src/bot/index.ts

import 'dotenv/config';
import { Client, GatewayIntentBits, Events, type Interaction } from 'discord.js';
import { slashCommands } from './commands/index.js';
import { logInfo, logWarn, logError } from './general/logging/logger.js';
import { trackCommandUsage } from './general/stats/statsManager.js';

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

// Einfacher zentraler Handler – später wandert das in eine eigene handler.ts
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

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

  try {
    await command.execute(interaction);

    // 🔹 Command-Usage in der DB tracken
    await trackCommandUsage(interaction);

    logInfo(`Command /${interaction.commandName} erfolgreich beendet`, {
      functionName: 'interaction',
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      commandName: interaction.commandName,
    });
  } catch (error) {
    logError(`Fehler bei /${interaction.commandName}`, {
      functionName: 'interaction',
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      commandName: interaction.commandName,
      extra: { error },
    });

    try {
      await interaction.reply({
        content:
          'Uff. Da ist was schiefgelaufen. Sag Hiro, er soll mal in die Logs schauen.',
        ephemeral: true,
      });
    } catch {
      // Ignorieren, wenn selbst das schief geht (z.B. schon geantwortet)
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
