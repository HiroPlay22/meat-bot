import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { prisma } from '@database/client.js';

// --- 📦 Voting starten
export async function executeMontagPoll(interaction: ChatInputCommandInteraction) {
  const existingPoll = await prisma.poll.findFirst({
    where: { endedAt: null, winnerId: null }
  });

  if (existingPoll) {
    await interaction.reply({
      content: '⚠️ Bereits ein Voting aktiv. Nutze `/poll montag ergebnis` oder `/poll montag close`, um es zu beenden.',
      ephemeral: true
    });
    return;
  }

  const lastPoll = await prisma.poll.findFirst({
    where: { endedAt: { not: null }, winnerId: { not: null } },
    orderBy: { endedAt: 'desc' }
  });

  const lastWinnerId = lastPoll?.winnerId || null;

  let funGames = await prisma.funGame.findMany({ orderBy: { name: 'asc' } });
  if (lastWinnerId) {
    funGames = funGames.filter(game => game.id !== lastWinnerId);
  }

  if (funGames.length === 0) {
    await interaction.reply({ content: '❌ Einsatzmaterial leer. Keine Spiele verfügbar.', ephemeral: true });
    return;
  }

  const poll = await prisma.poll.create({
    data: { question: 'Montags-Runde' }
  });

  funGames = shuffleArray(funGames).slice(0, 15);

  const embed = new EmbedBuilder()
    .setTitle('🎮 M.E.A.T.-Initiative: Game Selection *Montags-Runde*')
    .setDescription('📡 Wähle dein Einsatzspiel für Montag:')
    .setColor(0x00AEFF);

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  for (const game of funGames) {
    const button = new ButtonBuilder()
      .setCustomId(`vote_montag_${game.id}_${poll.id}`)
      .setLabel(game.name.length > 80 ? game.name.substring(0, 77) + '...' : game.name)
      .setStyle(ButtonStyle.Primary);

    currentRow.addComponents(button);

    if (currentRow.components.length >= 4) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }
  }

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  await interaction.reply({ embeds: [embed], components: rows });
  console.log("✅ Montagsspiel-Voting erstellt!");
}

// --- 📦 Voting-Ergebnis anzeigen
export async function executeMontagErgebnis(interaction: ChatInputCommandInteraction) {
  const poll = await prisma.poll.findFirst({
    where: { endedAt: null, winnerId: null }
  });

  if (!poll) {
    await interaction.reply({ content: '❌ Kein aktives Voting gefunden.', ephemeral: true });
    return;
  }

  const votes = await prisma.vote.findMany({
    where: { pollId: poll.id },
    include: { game: true }
  });

  if (votes.length === 0) {
    await interaction.reply({ content: '❌ Einsatzbericht leer. Keine Stimmen registriert.', ephemeral: true });
    return;
  }

  const embed = buildFalloutEmbed(votes, '📊 Fallout-Terminal: M.E.A.T.-Ergebnisprotokoll');
  await interaction.reply({ embeds: [embed] });
  console.log("✅ Ergebnis angezeigt.");
}

// --- 📦 Voting schließen
export async function executeMontagClose(interaction: ChatInputCommandInteraction) {
  const poll = await prisma.poll.findFirst({
    where: { endedAt: null, winnerId: null }
  });

  if (!poll) {
    await interaction.reply({ content: '❌ Kein aktives Voting zum Beenden gefunden.', ephemeral: true });
    return;
  }

  const votes = await prisma.vote.findMany({
    where: { pollId: poll.id },
    include: { game: true }
  });

  if (votes.length === 0) {
    await interaction.reply({ content: '❌ Keine Stimmen vorhanden. Nichts zu schließen.', ephemeral: true });
    return;
  }

  const counts: Record<string, { name: string, count: number }> = {};
  for (const vote of votes) {
    if (!counts[vote.gameId]) {
      counts[vote.gameId] = { name: vote.game.name, count: 0 };
    }
    counts[vote.gameId].count++;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  const winnerId = sorted[0][0];

  await prisma.poll.update({
    where: { id: poll.id },
    data: { endedAt: new Date(), winnerId }
  });

  const embed = buildFalloutEmbed(votes, '📊 Fallout-Terminal: M.E.A.T.-Abschlussprotokoll', counts[winnerId].name);
  await interaction.reply({ embeds: [embed], components: [] });
  console.log("✅ Voting geschlossen & Ergebnis gesendet.");
}

// --- 🔄 Helper
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createShortFalloutBar(percentage: number): string {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  const empty = blocks - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function buildFalloutEmbed(votes: { game: { name: string }, gameId: string }[], title: string, winnerName?: string) {
  const counts: Record<string, { name: string, count: number }> = {};
  for (const vote of votes) {
    if (!counts[vote.gameId]) {
      counts[vote.gameId] = { name: vote.game.name, count: 0 };
    }
    counts[vote.gameId].count++;
  }

  const totalVotes = votes.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  const topCount = sorted[0][1].count;

  let falloutContent = "```diff";
  for (const [_, { name, count }] of sorted) {
    const percent = Math.round((count / totalVotes) * 100);
    const bar = createShortFalloutBar(percent);
    const prefix = count === topCount ? "+" : "-";
    let nameDisplay = name.length > 18 ? name.slice(0, 15) + "..." : name;
    nameDisplay = nameDisplay.padEnd(18, ' ');
    falloutContent += `\n${prefix} ${nameDisplay} ${bar} ${percent}%${count === topCount ? " 🏆" : ""}`;
  }

  if (winnerName) {
    falloutContent += `\n\n👑 Gewonnen hat: **${winnerName}**`;
  }

  falloutContent += "\n```";

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(falloutContent)
    .setColor(0x00AEFF);
}
