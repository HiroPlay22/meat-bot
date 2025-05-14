import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const funGames = [
  { name: "Gartic Phone", isFree: true },
  { name: "skribbl.io", isFree: true },
  { name: "Witch It", isFree: false },
  { name: "Golf it", isFree: false },
  { name: "League of Legends", isFree: false },
  { name: "Party Animals", isFree: false },
  { name: "Agrou", isFree: false },
  { name: "FragPunk", isFree: true },
  { name: "Garrys Mod / TTT", isFree: false },
  { name: "Tabletop Simulator (allgemein)", isFree: false },
  { name: "Prison Life", isFree: false },
  { name: "Jackbox Party Pack 5 / Quiplash", isFree: false },
  { name: "Pummel Party", isFree: false },
  { name: "Codenames", isFree: true },
  { name: "Death by AI", isFree: false },
  { name: "Tabletop Mensch ärgere dich nicht", isFree: false },
  { name: "Tabletop Simulator Uno", isFree: false },
  { name: "Crab Game", isFree: true },
  { name: "Dead By Daylight", isFree: false },
  { name: "Supermarket Together", isFree: false },
  { name: "Fall Guys", isFree: false },
  { name: "Brawlhalla", isFree: true },
  { name: "Good old Counter Strike 2", isFree: true },
  { name: "Marvel Rivals", isFree: true },
  { name: "Overwatch", isFree: true },
  { name: "Wreckfest 2", isFree: false },
  { name: "Crusader Kings III", isFree: false },
  { name: "Munchkin Digital", isFree: false },
  { name: "Dale & Dawson", isFree: false },
  { name: "Cards Against Humanity", isFree: true },
  { name: "Geoguessr", isFree: true },
  { name: "Liar's Bar", isFree: false },
  { name: "Worms Clan Wars", isFree: false },
  { name: "Smite 2", isFree: true },
  { name: "PUBG", isFree: false },
  { name: "Valorant", isFree: true },
  { name: "Chivalry 2", isFree: false },
  { name: "Tribes of Midgard", isFree: false },
  { name: "Deadlock", isFree: true },
  { name: "REPO", isFree: false },
  { name: "Tabletop Simulator: Villainous", isFree: false },
  { name: "Don't Starve Together", isFree: false },
  { name: "Für Fortnite", isFree: false },
  { name: "Helldivers 2", isFree: false },
  { name: "SongTrivia", isFree: true },
  { name: "Dead or Alive 6", isFree: false },
  { name: "Mortal Kombat (1 oder 11)", isFree: false },
  { name: "Trail Out", isFree: false },
  { name: "Lockdown Protocol", isFree: false },
  { name: "Governor of Poker 3", isFree: true },
  { name: "Predecessor", isFree: true },
  { name: "No More Room in Hell", isFree: true },
  { name: "Jackbox Party Pack 4 / Survive the Internet", isFree: false },
  { name: "For Honor", isFree: false },
  { name: "Supervive", isFree: true },
  { name: "Civilization 6", isFree: false },
  { name: "Ultimate Chicken Horse", isFree: false },
  { name: "Hide and Shriek", isFree: true }
];

async function main() {
  console.log("🌱 Starte FunGame-Seed...");

  for (const game of funGames) {
    await prisma.funGame.upsert({
      where: { name: game.name },
      update: {},
      create: {
        name: game.name,
        isFree: game.isFree,
      },
    });
  }

  console.log("✅ Alle FunGames erfolgreich gespeichert!");
}

main()
  .catch((e) => {
    console.error("❌ Fehler beim Seed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
