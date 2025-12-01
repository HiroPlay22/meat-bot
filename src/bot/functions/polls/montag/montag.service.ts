// FILE: src/bot/functions/polls/montag/montag.service.ts

import type { GuildTextBasedChannel, Message } from 'discord.js';
import type { PollGame } from '@prisma/client';
import { PollType } from '@prisma/client';
import { prisma } from '../../../general/db/prisma.js';

export interface MontagGameView {
  id: string;
  name: string;
  isFree: boolean;
  maxPlayers?: number | null;
}

export interface MontagSetupState {
  allowMultiselect: boolean;
  durationHours: number;
  selectedGames: MontagGameView[];
}

// Simple In-Memory-Store pro User+Guild für den Setup-Flow
const setupStatePerUser = new Map<string, MontagSetupState>();

function stateKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function getOrInitSetupState(
  guildId: string,
  userId: string,
): MontagSetupState {
  const key = stateKey(guildId, userId);
  let state = setupStatePerUser.get(key);

  if (!state) {
    state = {
      allowMultiselect: true,
      durationHours: 1,
      selectedGames: [],
    };
    setupStatePerUser.set(key, state);
  }

  return state;
}

export function ermittleMontagPollErgebnis(message: Message): {
  winnerNames: string[];
  maxVotes: number;
  answersDebug: { text: string | null; voteCount: number }[];
} {
  const pollAny = (message.poll ?? null) as any;

  if (!pollAny) {
    return { winnerNames: [], maxVotes: 0, answersDebug: [] };
  }

  const rawAnswers = pollAny.answers;
  const answers: any[] =
    rawAnswers && typeof rawAnswers.map === 'function'
      ? rawAnswers.map((a: any) => a)
      : Array.isArray(rawAnswers)
      ? rawAnswers
      : [];

  let maxVotes = 0;

  for (const ans of answers) {
    const votes = Number(ans.voteCount ?? ans.count ?? 0);
    if (votes > maxVotes) maxVotes = votes;
  }

  const winnerNames =
    maxVotes > 0
      ? answers
          .filter((ans) => Number(ans.voteCount ?? ans.count ?? 0) === maxVotes)
          .map((ans) =>
            String(
              ans.text ??
                ans.pollMedia?.text ??
                ans.pollMedia?.question?.text ??
                '',
            ).trim(),
          )
          .filter((name) => name.length > 0)
      : [];

  const answersDebug = answers.map((ans) => ({
    text:
      ans.text ?? ans.pollMedia?.text ?? ans.pollMedia?.question?.text ?? null,
    voteCount: Number(ans.voteCount ?? ans.count ?? 0),
  }));

  return { winnerNames, maxVotes, answersDebug };
}

export function getSetupState(
  guildId: string,
  userId: string,
): MontagSetupState | undefined {
  return setupStatePerUser.get(stateKey(guildId, userId));
}

export function resetSetupState(guildId: string, userId: string): void {
  setupStatePerUser.delete(stateKey(guildId, userId));
}

/**
 * Anzahl aktiver Spiele aus der DB (für Anzeige im Setup-Embed).
 */
export async function ermittleGesamtGameCount(): Promise<number> {
  return prisma.pollGame.count({
    where: { isActive: true },
  });
}

// Alias, falls irgendwo noch der alte Name verwendet wird
export const getGesamtGameCount = ermittleGesamtGameCount;

/**
 * Ermittelt die letzten Gewinner-Spiele (per winnerGameId) für diese Guild
 * und gibt sowohl IDs als auch Namen zurück.
 *
 * Wird genutzt für:
 *  - Ausschluss in der Spieleauswahl
 *  - Anzeige im Setup-Embed ("zuletzt gespielt")
 */
export async function ermittleAusgeschlosseneGewinner(
  guildId: string,
  limit = 2,
): Promise<{ excludedGameIds: string[]; excludedGameNames: string[] }> {
  const polls = await prisma.poll.findMany({
    where: {
      guildId,
      type: PollType.MONTAG,
      endedAt: { not: null },
      winnerGameId: { not: null },
    },
    orderBy: { endedAt: 'desc' },
    take: limit,
    include: {
      winnerGame: true,
    },
  });

  const excludedGameIds: string[] = [];
  const excludedGameNames: string[] = [];

  for (const poll of polls) {
    if (poll.winnerGameId) {
      excludedGameIds.push(poll.winnerGameId);
    }
    if (poll.winnerGame?.name) {
      excludedGameNames.push(poll.winnerGame.name);
    }
  }

  return { excludedGameIds, excludedGameNames };
}

function mische<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Lädt aktive Spiele aus der Datenbank und wählt bis zu maxOptions zufällig aus.
 *
 * NEU:
 * - Gewinner der letzten 2 Montags-Polls (pro Guild) werden ausgeschlossen,
 *   damit sie nicht direkt wieder auftauchen.
 */
export async function prepareRandomGamesForState(
  guildId: string,
  userId: string,
  maxOptions = 10,
): Promise<MontagSetupState> {
  const state = getOrInitSetupState(guildId, userId);

  const { excludedGameIds } = await ermittleAusgeschlosseneGewinner(guildId, 2);

  let games: PollGame[];

  if (excludedGameIds.length) {
    // Alle aktiven Spiele außer den letzten zwei Gewinnern
    games = await prisma.pollGame.findMany({
      where: {
        isActive: true,
        id: {
          notIn: excludedGameIds,
        },
      },
    });

    // Falls dadurch nichts mehr übrig bleibt → Fallback: alle aktiven Spiele
    if (!games.length) {
      games = await prisma.pollGame.findMany({
        where: { isActive: true },
      });
    }
  } else {
    // Es gibt noch keine Gewinner-Historie → alle aktiven Spiele
    games = await prisma.pollGame.findMany({
      where: { isActive: true },
    });
  }

  if (!games.length) {
    state.selectedGames = [];
    return state;
  }

  const shuffled = mische<PollGame>(games);
  const selection = shuffled.slice(0, maxOptions);

  state.selectedGames = selection.map<MontagGameView>((game: PollGame) => ({
    id: game.id,
    name: game.name,
    isFree: game.isFree,
    maxPlayers: game.maxPlayers,
  }));

  return state;
}

/**
 * Erzeugt den nativen Discord-Poll im Ziel-Channel.
 * Gibt die erzeugte Nachricht zurück oder null, falls etwas schiefgeht.
 */
export async function createNativeMontagPoll(params: {
    channel: GuildTextBasedChannel;
    questionText: string;
    state: MontagSetupState;
  }): Promise<Message | null> {
  const { channel, questionText, state } = params;

  if (!state.selectedGames.length) return null;

  const answers = state.selectedGames.map((game) => ({
    text: game.name,
  }));

  try {
    const durationHours = Math.max(1, Math.min(32 * 24, state.durationHours));

    const message = await channel.send({
      poll: {
        question: {
          text: questionText,
        },
        duration: durationHours, // Discord erwartet Stunden, max. 32 Tage
        allowMultiselect: state.allowMultiselect,
        answers,
      },
    });

    return message;
  } catch {
    // Wenn Poll-Erstellung scheitert (z.B. fehlende Rechte)
    return null;
  }
}
