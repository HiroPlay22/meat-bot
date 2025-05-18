import { APIEmbed, EmbedBuilder } from 'discord.js'
import { DinoName } from '@prisma/client'

type DinoSettings = {
  color?: string
  type?: string
  size?: string
  style?: string
}

export function buildDinoEmbed(names: DinoName[], settings: DinoSettings, rerollCount = 0): APIEmbed {
  const embed = new EmbedBuilder()
    .setTitle('🦖 ARKitekt // Vorschläge für dein Biest')
    .setColor(getEmbedColor(settings.color))
    .setDescription('\n' + formatNames(names) + '\n\n' + getQuote(rerollCount)) // Leerzeile NACH Titel

  const footerText = formatFooter(settings)
  if (footerText) {
    embed.setFooter({ text: footerText })
  }

  return embed.toJSON()
}

function formatNames(names: DinoName[]): string {
  const chunks = names.slice(0, 8).map(n => `**${n.name}**`)
  const rows = [
    chunks.slice(0, 4).join(' '),
    chunks.slice(4, 8).join(' ')
  ]
  return rows.join('\n') // Kein Abstand mehr zwischen den Zeilen
}

function getQuote(rerollCount: number): string {
  if (rerollCount >= 5) return 'Du kannst ihn/sie auch einfach M.E.A.T. nennen. KAPPA'
  const quotes = [
    'Das Leben findet einen Weg – oder wenigstens einen Namen.',
    'Wenn dus benennst, gehört es dir.',
    'Das ist ein Dino, kein Haustier.',
    'Das ist kein Pokémon.',
    'Dieser Dino hört eh nicht auf dich.',
    'Trash entsteht beim Würfeln.',
    'Protokoll 42 abgeschlossen: Taufe simuliert.',
    'Der Name wurde bestimmt. Die Konsequenzen auch.',
    'Nicht biologisch plausibel, aber klingt geil.',
    'Du hast ihn erzeugt. Jetzt gib ihm einen Namen.',
    'Im Zweifel: MEAT.',
    'Er wird dich fressen. Aber wenigstens hört er auf dich.',
    'Du kannst ihn nicht Bob nennen. Der letzte Bob ist gefressen worden.',
    'Cleverer Name. Für ein noch clevereres Biest.',
    'Taming effizienz bei den Namen kritisch gesunken.',
    'Du hast ihn getamed. Jetzt gib ihm eine Identität.',
    'Erst ein Name! Danach kannst du einen Sattel craften',
    'Namen sind der Anfang jeder Legende.',
    'Wenn du denkst er lebt nicht lange, dann gib ihm nur eine Nummer!',
    'Die Namens-DNA wurde geladen.'
  ]
  return '> ' + quotes[Math.floor(Math.random() * quotes.length)]
}

function formatFooter(settings: DinoSettings): string {
  const icons: Record<string, string> = {
    rot: '🔴', gruen: '🟢', blau: '🔵', gelb: '🟡', orange: '🟠',
    lila: '🟣', braun: '🟤', pink: '🩷', schwarz: '⚫', weiss: '⚪',
    fleischfresser: '🍖', vegetarier: '🌿'
  }

  const iconParts = [
    settings.color ? icons[settings.color] : null,
    settings.type ? icons[settings.type] : null
  ].filter(Boolean)

  const textParts = [
    settings.size,
    settings.style
  ].filter(Boolean)

  return [...iconParts, ...textParts].join(', ')
}

function getEmbedColor(color?: string): number {
  const colorMap: Record<string, number> = {
    rot: 0xD0021B,
    orange: 0xF5A623,
    gelb: 0xF8E71C,
    gruen: 0x7ED321,
    blau: 0x4A90E2,
    lila: 0x9013FE,
    braun: 0x8B572A,
    pink: 0xFF69B4,
    schwarz: 0x111111,
    weiss: 0xEEEEEE
  }
  return color ? (colorMap[color] ?? 0x888888) : 0x2f3136
}