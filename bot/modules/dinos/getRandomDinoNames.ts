import { PrismaClient, DinoColor, DinoType, DinoSize, DinoStyle } from '@prisma/client'

const prisma = new PrismaClient()

type DinoFilter = {
  color?: DinoColor
  type?: DinoType
  size?: DinoSize
  style?: DinoStyle
}

export async function getRandomDinoNames(filters: DinoFilter, limit: number = 8) {
  const whereClause: any = {
    approved: true,
    ...(filters.color && { color: filters.color }),
    ...(filters.type && { type: filters.type }),
    ...(filters.size && { size: filters.size }),
    ...(filters.style && { style: filters.style }),
  }

  const results = await prisma.dinoName.findMany({
    where: whereClause,
    orderBy: { id: 'asc' } // Temp for random fallback
  })

  // Zufällige Auswahl
  const shuffled = results.sort(() => 0.5 - Math.random())
  const picked = shuffled.slice(0, limit)

  // Fallback, wenn nicht genug passende Einträge
  if (picked.length < limit) {
    const fallback = await prisma.dinoName.findMany({
      where: { approved: true },
    })
    const shuffledFallback = fallback.sort(() => 0.5 - Math.random())
    return shuffledFallback.slice(0, limit)
  }

  return picked
}