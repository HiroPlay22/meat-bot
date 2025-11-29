// FILE: src/bot/functions/sentinel/datenschutz/datenschutz.buttons.ts

import type { ButtonInteraction } from 'discord.js';
import {
  ermittleTrackingStatus,
  setzeTrackingStatus,
  type TrackingStatusTyp,
} from './datenschutz.service.js';
import { baueDatenschutzEmbedUndKomponenten } from './datenschutz.embeds.js';
import { ladeTexte } from '../../../general/texts/text-loader.js';
import { logError } from '../../../general/logging/logger.js';

const texte = ladeTexte('sentinel/datenschutz', 'de');

export async function bearbeiteDatenschutzButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildId = interaction.guildId;
  const userId = interaction.user?.id ?? null;

  if (!guildId || !userId) {
    await interaction.reply({
      content:
        'Dieser Button funktioniert nur auf einem Server mit eindeutigem Benutzerkontext.',
      ephemeral: true,
    });
    return;
  }

  const customId = interaction.customId;

  let neuerStatus: TrackingStatusTyp | null = null;
  let antwortText: string | null = null;

  try {
    const aktuellerStatus = await ermittleTrackingStatus(guildId, userId);

    if (customId === 'sentinel_datenschutz_allow') {
      if (aktuellerStatus === 'allowed') {
        antwortText = texte.responses.noChange;
      } else {
        neuerStatus = 'allowed';
        antwortText = texte.responses.changedToAllowed;
      }
    } else if (
      customId === 'sentinel_datenschutz_deny' ||
      customId === 'sentinel_datenschutz_revoke'
    ) {
      if (aktuellerStatus === 'denied') {
        antwortText = texte.responses.noChange;
      } else {
        neuerStatus = 'denied';
        antwortText = texte.responses.changedToDenied;
      }
    } else if (
      customId === 'sentinel_datenschutz_active' ||
      customId === 'sentinel_datenschutz_denied'
    ) {
      // Diese Buttons sind eigentlich disabled
      antwortText = texte.responses.noChange;
    }

    let anzuzeigenderStatus: TrackingStatusTyp = aktuellerStatus;

    if (neuerStatus) {
      await setzeTrackingStatus(guildId, userId, neuerStatus, 'v1');
      anzuzeigenderStatus = neuerStatus;
    }

    const { embed, komponenten } =
      baueDatenschutzEmbedUndKomponenten(anzuzeigenderStatus);

    // Ursprüngliche (ephemere) Nachricht aktualisieren
    await interaction.update({
      embeds: [embed],
      components: komponenten,
    });

    if (antwortText) {
      await interaction.followUp({
        content: antwortText,
        ephemeral: true,
      });
    }
  } catch (error) {
    logError('Fehler bei der Verarbeitung eines Datenschutz-Buttons', {
      functionName: 'bearbeiteDatenschutzButton',
      guildId,
      userId,
      extra: { error, customId },
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: texte.responses.error,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: texte.responses.error,
        ephemeral: true,
      });
    }
  }
}
