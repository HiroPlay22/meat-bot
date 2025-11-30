// FILE: src/bot/functions/polls/montag/montag.modals.ts

import type { ModalSubmitInteraction } from 'discord.js';
import { prisma } from '../../../general/db/prisma.js';
import { logError, logInfo } from '../../../general/logging/logger.js';

function parseIsFree(inputRaw: string): boolean {
  const inLower = inputRaw.trim().toLowerCase();
  if (!inLower) return false;

  const yesWords = ['ja', 'j', 'yes', 'y', 'free', 'f2p', 'kostenlos'];
  return yesWords.includes(inLower);
}

function parseMaxPlayers(inputRaw: string): number | null {
  const trimmed = inputRaw.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function handleMontagAddGameModal(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  const guildId = interaction.guildId ?? undefined;
  const userId = interaction.user.id;

  if (!guildId) {
    await interaction.reply({
      content:
        'Dieses Formular kann nur auf einem Server verwendet werden. Bitte probiere es noch einmal auf einem Discord-Server.',
      ephemeral: true,
    });
    return;
  }

  try {
    const nameRaw = interaction.fields
      .getTextInputValue('poll_montag_add_game_name')
      .trim();
    const isFreeRaw = interaction.fields
      .getTextInputValue('poll_montag_add_game_is_free')
      .trim();
    const maxPlayersRaw =
      interaction.fields.getTextInputValue(
        'poll_montag_add_game_max_players',
      ) ?? '';

    if (!nameRaw) {
      await interaction.reply({
        content: 'Du musst mindestens einen Spielnamen angeben.',
        ephemeral: true,
      });
      return;
    }

    const isFree = parseIsFree(isFreeRaw);
    const maxPlayers = parseMaxPlayers(maxPlayersRaw);

    const game = await prisma.pollGame.create({
      data: {
        name: nameRaw,
        isFree,
        maxPlayers,
        isActive: true,
      },
    });

    logInfo('Neues PollGame angelegt', {
      functionName: 'handleMontagAddGameModal',
      guildId,
      userId,
      extra: {
        gameId: game.id,
        name: game.name,
        isFree: game.isFree,
        maxPlayers: game.maxPlayers,
      },
    });

    const details: string[] = [];
    details.push(isFree ? '✅ kostenlos spielbar' : '💸 kostenpflichtig');
    if (maxPlayers) {
      details.push(`👥 max. ${maxPlayers} Spieler`);
    }

    await interaction.reply({
      content: [
        `Spiel **${game.name}** wurde gespeichert.`,
        details.length ? details.join(' · ') : '',
        '',
        'Es wird ab sofort in der zufälligen Spiele-Auswahl für die Montags-Runde berücksichtigt.',
      ]
        .filter(Boolean)
        .join('\n'),
      ephemeral: true,
    });
  } catch (error) {
    logError('Fehler beim Anlegen eines PollGame-Eintrags', {
      functionName: 'handleMontagAddGameModal',
      guildId,
      userId,
      extra: { error },
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          'Beim Speichern des Spiels ist etwas schiefgelaufen. Schau bitte in die Logs oder versuch es später noch einmal.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          'Beim Speichern des Spiels ist etwas schiefgelaufen. Schau bitte in die Logs oder versuch es später noch einmal.',
        ephemeral: true,
      });
    }
  }
}
