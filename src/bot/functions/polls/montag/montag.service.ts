// FILE: src/bot/functions/polls/montag/montag.service.ts

import type { GuildTextBasedChannel, Message } from 'discord.js';
import { PollLayoutType } from 'discord.js';

export interface MontagGame {
  id: string;
  name: string;
  isFree: boolean;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface MontagPollSetupState {
  durationHours: number;
  allowMultiselect: boolean;
  selectedGames: MontagGame[];
}

// 👉 Dummy-Games – später Prisma-DB
const ALL_GAMES: MontagGame[] = [
  { id: 'rocket_league', name: 'Rocket League', isFree: true, minPlayers: 2, maxPlayers: 4 },
  { id: 'deep_rock', name: 'Deep Rock Galactic', isFree: false, minPlayers: 2, maxPlayers: 4 },
  { id: 'fall_guys', name: 'Fall Guys', isFree: true, minPlayers: 4, maxPlayers: 60 },
  { id: 'gartic_phone', name: 'Gartic Phone', isFree: true, minPlayers: 4, maxPlayers: 16 },
  { id: 'golf_it', name: 'Golf It!', isFree: false, minPlayers: 2, maxPlayers: 12 },
  { id: 'among_us', name: 'Among Us', isFree: false, minPlayers: 4, maxPlayers: 15 },
  { id: 'plateup', name: 'PlateUp!', isFree: false, minPlayers: 2, maxPlayers: 4 },
  { id: 'overcooked', name: 'Overcooked 2', isFree: false, minPlayers: 2, maxPlayers: 4 },
];

const setupState = new Map<string, MontagPollSetupState>();

function buildStateKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}:montag`;
}

export function getOrInitSetupState(
  guildId: string,
  userId: string,
): MontagPollSetupState {
  const key = buildStateKey(guildId, userId);
  const existing = setupState.get(key);

  if (existing) return existing;

  const neu: MontagPollSetupState = {
    durationHours: 24,
    allowMultiselect: true,
    selectedGames: [],
  };

  setupState.set(key, neu);
  return neu;
}

export function getSetupState(
  guildId: string,
  userId: string,
): MontagPollSetupState | null {
  const key = buildStateKey(guildId, userId);
  return setupState.get(key) ?? null;
}

export function resetSetupState(guildId: string, userId: string): void {
  const key = buildStateKey(guildId, userId);
  setupState.delete(key);
}

/**
 * Wählt zufällig bis zu maxGames Spiele aus dem Pool
 * und speichert sie im State.
 */
export function prepareRandomGamesForState(
  guildId: string,
  userId: string,
  maxGames = 10,
): MontagPollSetupState {
  const state = getOrInitSetupState(guildId, userId);

  const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5);
  const limited = shuffled.slice(0, Math.min(maxGames, shuffled.length));

  state.selectedGames = limited;

  return state;
}

/**
 * Formatiert den Text für eine native Poll-Antwort (max. 55 Zeichen).
 */
function formatGameAnswer(game: MontagGame): string {
  const freeText = game.isFree ? 'free' : 'paid';
  const playersText =
    game.minPlayers && game.maxPlayers
      ? `${game.minPlayers}-${game.maxPlayers}p`
      : game.maxPlayers
        ? `max ${game.maxPlayers}p`
        : game.minPlayers
          ? `min ${game.minPlayers}p`
          : '';

  const meta = [playersText, freeText].filter(Boolean).join(', ');
  const base = meta ? `${game.name} (${meta})` : game.name;

  if (base.length <= 55) return base;
  return base.slice(0, 52) + '...';
}

/**
 * Erstellt den nativen Discord-Poll in einem Guild-Textchannel.
 */
export async function createNativeMontagPoll(options: {
  channel: GuildTextBasedChannel;
  questionText: string;
  state: MontagPollSetupState;
}): Promise<Message | null> {
  const { channel, questionText, state } = options;

  if (!state.selectedGames.length) {
    return null;
  }

  const answers = state.selectedGames.map((game) => ({
    text: formatGameAnswer(game),
    emoji: '',
  }));

  const message = await channel.send({
    content: '🕹️ **Montags-Runde – Abstimmung**',
    poll: {
      question: { text: questionText },
      answers,
      allowMultiselect: state.allowMultiselect,
      duration: state.durationHours,
      layoutType: PollLayoutType.Default,
    },
  });

  return message;
}

/**
 * Nur für die Anzeige im Setup-Embed.
 */
export function getGesamtGameCount(): number {
  return ALL_GAMES.length;
}
