// FILE: src/bot/functions/welcome/welcome.reactions.ts

import type { GuildEmoji, Message } from 'discord.js';

// Pool an Standard-Emojis (Gaming / Hype / allgemein nice)
const UNICODE_EMOJIS = [
  '🔥',
  '🎮',
  '✨',
  '🎉',
  '⭐',
  '⚡',
  '🚀',
  '🕹️',
  '💥',
  '🎧',
  '🥰',
  '💜',
  '💎',
  '🧠',
];

/**
 * Hilfsfunktion: zieht bis zu `count` zufällige, eindeutige Elemente aus einem Array.
 */
function pickRandomUnique<T>(array: T[], count: number): T[] {
  if (array.length === 0 || count <= 0) return [];

  const arr = [...array];
  const result: T[] = [];

  const max = Math.min(count, arr.length);

  for (let i = 0; i < max; i++) {
    const index = Math.floor(Math.random() * arr.length);
    const [item] = arr.splice(index, 1);
    result.push(item);
  }

  return result;
}

/**
 * Lässt M.E.A.T. mit ein paar zufälligen Gaming-/Hype-Reactions
 * auf die Willkommensnachricht reagieren.
 *
 * - Insgesamt immer 3 Reactions
 * - Wenn möglich: zufällige Server-Emojis (max. 2)
 * - Rest wird mit Unicode-Emojis aufgefüllt
 */
export async function reagiereMitWelcomeEmotes(
  message: Message,
): Promise<void> {
  const emojis: string[] = [];

  // 1) Versuche, 1–2 zufällige Custom-Emojis vom Server zu nehmen
  const guildEmojis = message.guild?.emojis.cache;
  if (guildEmojis && guildEmojis.size > 0) {
    const alleCustom = Array.from(guildEmojis.values()) as GuildEmoji[];

    // max 2 Custom-Emojis, damit wir noch Platz für Unicode haben
    const maxCustom = Math.min(2, alleCustom.length);
    const customCount = maxCustom > 0 ? Math.ceil(Math.random() * maxCustom) : 0;

    const pickedCustom = pickRandomUnique(alleCustom, customCount).map((e) =>
      e.toString(),
    );

    emojis.push(...pickedCustom);
  }

  // 2) Unicode-Emojis auffüllen, bis wir 3 haben
  const remaining = 3 - emojis.length;
  if (remaining > 0) {
    const pickedUnicode = pickRandomUnique(UNICODE_EMOJIS, remaining);
    emojis.push(...pickedUnicode);
  }

  // Fallback, falls aus irgendeinem Grund noch nichts drin ist
  if (emojis.length === 0) {
    emojis.push('🔥', '🎮', '✨');
  }

  // 3) Reactions senden
  for (const emojiStr of emojis) {
    try {
      await message.react(emojiStr);
    } catch {
      // Ignorieren – kein Hard-Fail, wenn Emotes oder Rechte fehlen
    }
  }
}
