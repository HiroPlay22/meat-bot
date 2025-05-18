import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.dinoName.deleteMany()
  console.log("🧼 Bestehende Dino-Namen gelöscht")

  const data = [
    { name: "Nibblina", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Leafyboo", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Spruzzel", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Munchlet", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Dinolette", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Pluffel", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Berribite", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Snifflor", size: "klein", type: "vegetarier", style: "suess", approved: true },
    { name: "Gorezilla", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Blightfang", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Meatrox", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Chomperdon", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Bloodhowl", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Fleshrush", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Mutilagon", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Tyrantaur", size: "gross", type: "fleischfresser", style: "gefaehrlich", approved: true },
    { name: "Mudomax", size: "mittel", type: "vegetarier", style: "rtl", approved: true },
    { name: "Fernsehraptor", size: "mittel", type: "fleischfresser", style: "rtl", approved: true },
    { name: "Schnulzosaur", size: "mittel", type: "vegetarier", style: "rtl", approved: true },
    { name: "Dinoshaker", size: "mittel", type: "fleischfresser", style: "rtl", approved: true },
    { name: "GZSZilla", size: "mittel", type: "vegetarier", style: "rtl", approved: true },
    { name: "Schundadon", size: "mittel", type: "vegetarier", style: "rtl", approved: true },
    { name: "Trashraptor", size: "mittel", type: "fleischfresser", style: "rtl", approved: true },
    { name: "Knallblattrex", size: "mittel", type: "vegetarier", style: "rtl", approved: true }
  ]

  for (const dino of data) {
    await prisma.dinoName.create({ data: dino })
  }

  console.log("✅ Neue Dino-Namen gespeichert!")
}

main().finally(() => prisma.$disconnect())