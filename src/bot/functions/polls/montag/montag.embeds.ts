// FILE: src/bot/functions/polls/montag/montag.embeds.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import type { MontagSetupState } from './montag.service.js';

interface MontagSetupViewParams {
  serverName: string;
  nextMontagText: string;
  gameCount: number;
  state: MontagSetupState;
}

interface MontagPreviewViewParams {
  serverName: string;
  nextMontagText: string;
  state: MontagSetupState;
}

export function baueMontagSetupView(
  params: MontagSetupViewParams,
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const { serverName, nextMontagText, gameCount, state } = params;

  const descriptionLines: string[] = [
    `🕹 **Montags-Runde Setup für _${serverName}_**`,
    '',
    `📅 Geplante Session: **${nextMontagText}**`,
    `🎮 Verfügbare Spiele in der Datenbank: **${gameCount}**`,
    '',
    `🔁 Mehrfachauswahl: **${state.allowMultiselect ? 'aktiv' : 'deaktiviert'}**`,
    `⏱ Dauer: **${state.durationHours}h**`,
    '',
    '➡ Klicke auf **„Umfrage vorbereiten“**, um eine zufällige Auswahl an Spielen zu generieren.',
  ];

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Setup')
    .setDescription(descriptionLines.join('\n'))
    .setColor(0x5865f2);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_prepare')
      .setStyle(ButtonStyle.Primary)
      .setLabel('Umfrage vorbereiten'),
    new ButtonBuilder()
      .setCustomId('poll_montag_add_game')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Spiel hinzufügen'),
    new ButtonBuilder()
      .setCustomId('poll_montag_remove_game')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Spiel deaktivieren'),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_toggle_multiselect')
      .setStyle(ButtonStyle.Secondary)
      .setLabel(
        state.allowMultiselect ? 'Nur 1 Stimme erlauben' : 'Mehrfachauswahl erlauben',
      ),
    new ButtonBuilder()
      .setCustomId('poll_montag_duration_dec')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('- 1h'),
    new ButtonBuilder()
      .setCustomId('poll_montag_duration_inc')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('+ 1h'),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_cancel')
      .setStyle(ButtonStyle.Danger)
      .setLabel('Abbrechen'),
  );

  return {
    embed,
    components: [row1, row2, row3],
  };
}

export function baueMontagPreviewView(
  params: MontagPreviewViewParams,
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const { serverName, nextMontagText, state } = params;

  const spielListe =
    state.selectedGames.length > 0
      ? state.selectedGames
          .map((game, index) => {
            const infos: string[] = [];
            infos.push(`**${index + 1}. ${game.name}**`);

            const metaParts: string[] = [];
            if (game.isFree) metaParts.push('kostenlos');
            if (game.maxPlayers) metaParts.push(`${game.maxPlayers} Spieler`);

            if (metaParts.length > 0) {
              infos.push(`   _(${metaParts.join(' · ')})_`);
            }

            return infos.join('\n');
          })
          .join('\n')
      : '_Keine Spiele ausgewählt – bitte Setup anpassen._';

  const descriptionLines: string[] = [
    `🕹 **Montags-Runde Vorschau für _${serverName}_**`,
    '',
    `📅 Session: **${nextMontagText}**`,
    `🔁 Mehrfachauswahl: **${state.allowMultiselect ? 'aktiv' : 'deaktiviert'}**`,
    `⏱ Dauer: **${state.durationHours}h**`,
    '',
    '🎮 **Spiele in dieser Umfrage:**',
    spielListe,
  ];

  const embed = new EmbedBuilder()
    .setTitle('Montags-Runde – Vorschau')
    .setDescription(descriptionLines.join('\n'))
    .setColor(0x57f287);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_preview_back')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Zurück zum Setup'),
    new ButtonBuilder()
      .setCustomId('poll_montag_reroll')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Spiele neu würfeln'),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('poll_montag_start')
      .setStyle(ButtonStyle.Success)
      .setLabel('Umfrage starten'),
    new ButtonBuilder()
      .setCustomId('poll_montag_cancel')
      .setStyle(ButtonStyle.Danger)
      .setLabel('Abbrechen'),
  );

  return {
    embed,
    components: [row1, row2],
  };
}
