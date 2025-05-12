import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Dino Names
  await prisma.dinoName.createMany({
    data: [
      {
        dinoName: "T-Rex",
        style: "Trashig",
        color: "blau",
        traits: "episch,gefährlich",
        name: "Rexonator"
      },
      {
        dinoName: "T-Rex",
        style: "Mutiert",
        color: "grün",
        traits: "mutiert,stark",
        name: "Gnashtron"
      },
      {
        dinoName: "Dodo",
        style: "Silly",
        color: "gelb",
        traits: "süß,tollpatschig",
        name: "Peepus"
      },
      {
        dinoName: "Raptor",
        style: "Edel",
        color: "rot",
        traits: "schnell,gefährlich",
        name: "Crimsonclaw"
      }
    ]
  });
  

  // Seed Color Stats
  await prisma.dinoColorStat.createMany({
    data: [
      { color: "rot" },
      { color: "orange" },
      { color: "gelb" },
      { color: "grün" },
      { color: "blau" },
      { color: "violett" },
      { color: "grau" },
      { color: "schwarz" }
    ]
  });

  console.log("Seed abgeschlossen!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
