import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { emoji, safe } from "../../../general/style/emoji.js";
import type { MontagSetupState } from "./montag.service.js";

interface MontagSetupViewParams {
  serverName: string;
  serverIconUrl?: string | null;
  nextMontagText: string;
  gameCount: number;
  state: MontagSetupState;
  excludedGameNames?: string[];
}

function formatDurationText(hours: number): string {
  const clamped = Math.max(1, Math.min(hours, 32 * 24));
  const days = Math.floor(clamped / 24);
  const restHours = clamped % 24;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(days === 1 ? "1 Tag" : `${days} Tage`);
  }
  if (restHours > 0 || parts.length === 0) {
    parts.push(restHours === 1 ? "1 Stunde" : `${restHours} Stunden`);
  }

  return parts.join(" ");
}

interface MontagPreviewViewParams {
  serverName: string;
  serverIconUrl?: string | null;
  nextMontagText: string;
  state: MontagSetupState;
}

export function baueMontagSetupView(params: MontagSetupViewParams): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const {
    serverName,
    serverIconUrl,
    nextMontagText,
    gameCount,
    state,
    excludedGameNames = [],
  } = params;

  const iconGame = safe(emoji.meat_game);
  const iconServers = safe(emoji.meat_servers);
  const iconMulti = safe(emoji.meat_votings);
  const iconDuration = safe(emoji.meat_boss);
  const iconExclude = safe(emoji.meat_lock);

  const multiText = state.allowMultiselect
    ? "aktiv (Mehrfachauswahl)"
    : "nur 1 Stimme pro Person";

  const dauerText = formatDurationText(state.durationHours);

  const excludedText =
    excludedGameNames.length > 0
      ? [
          "Ausgeschlossen (zuletzt gespielt):",
          excludedGameNames.map((n) => `${iconGame} ${n}`).join("   "),
        ].join("\n")
      : `${iconExclude} Aktuell wird kein Spiel aufgrund der letzten Gewinner ausgeschlossen.`;

  const embed = new EmbedBuilder()
    .setTitle(`Montags-Runde Setup für _${serverName}_`)
    .setThumbnail(serverIconUrl ?? null)
    .setDescription(
      [
        `${iconServers} Verfügbare Spiele in der CD: \`${gameCount}\``,
        `${iconMulti} Mehrfachauswahl: **${multiText}** \`${multiText}\``,
        `${iconDuration} Dauer: **${dauerText}** \`${dauerText}\``,
        `${safe(emoji.meat_calendar)} Geplante Session: \`${nextMontagText}\``,
        "",
        excludedText,
        "",
        `> Klicke auf **„Umfrage planen“**, um eine zufällige Auswahl an Spielen zu generieren.`,
      ].join("\n"),
    )
    .setColor(0x579326);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("poll_montag_prepare")
      .setStyle(ButtonStyle.Primary)
      .setLabel("Umfrage planen"),
    new ButtonBuilder()
      .setCustomId("poll_montag_add_game")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Spiel hinzufügen"),
    new ButtonBuilder()
      .setCustomId("poll_montag_toggle_multiselect")
      .setStyle(state.allowMultiselect ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setLabel("Mehrfachauswahl"),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("poll_montag_duration_dec")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("- 1h"),
    new ButtonBuilder()
      .setCustomId("poll_montag_duration_dec5")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("- 5h"),
    new ButtonBuilder()
      .setCustomId("poll_montag_duration_inc")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("+ 1h"),
    new ButtonBuilder()
      .setCustomId("poll_montag_duration_inc5")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("+ 5h"),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("poll_montag_cancel")
      .setStyle(ButtonStyle.Danger)
      .setLabel("Abbrechen"),
  );

  return {
    embed,
    components: [row1, row2, row3],
  };
}

export function baueMontagPreviewView(params: MontagPreviewViewParams): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const { serverName, serverIconUrl, nextMontagText, state } = params;

  const iconCalendar = safe(emoji.meat_calendar);
  const iconMulti = safe(emoji.meat_votings);
  const iconDuration = safe(emoji.meat_boss);
  const iconGames = safe(emoji.meat_game);

  const selectedText = state.selectedGames.length
    ? state.selectedGames
        .map((game, index) => {
          const details: string[] = [];
          if (game.isFree) details.push("F2P");
          if (game.maxPlayers != null) {
            details.push(`max. ${game.maxPlayers} Spieler`);
          }
          const suffix = details.length ? ` (_${details.join(" • ")}_ )` : "";
          return `${index + 1}. **${game.name}**${suffix}`;
        })
        .join("\n")
    : "_Keine Spiele ausgewählt – bitte Setup anpassen._";

  const embed = new EmbedBuilder()
    .setTitle(`Montags-Runde Vorschau für _${serverName}_`)
    .setThumbnail(serverIconUrl ?? null)
    .setDescription(
      [
        `${iconGames} **Spiele in dieser Umfrage:**`,
        selectedText,
        "",
        `${iconMulti} Mehrfachauswahl: **${
          state.allowMultiselect ? "aktiv" : "nur 1 Stimme"
        }** \`${state.allowMultiselect ? "aktiv" : "nur 1 Stimme"}\``,
        `${iconDuration} Dauer: **${formatDurationText(state.durationHours)}** \`${formatDurationText(state.durationHours)}\``,
        `${iconCalendar} Session: \`${nextMontagText}\``,
      ].join("\n"),
    )
    .setColor(0x57f287);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("poll_montag_start")
      .setStyle(ButtonStyle.Success)
      .setLabel("Umfrage starten"),
    new ButtonBuilder()
      .setCustomId("poll_montag_reroll")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Spiele neu würfeln"),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("poll_montag_preview_back")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Zurück zum Setup"),
    new ButtonBuilder()
      .setCustomId("poll_montag_cancel")
      .setStyle(ButtonStyle.Danger)
      .setLabel("Abbrechen"),
  );

  return {
    embed,
    components: [row1, row2],
  };
}
