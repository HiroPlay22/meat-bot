  export function getModuleColor(module: string): number {
    const map: Record<string, number> = {
      general: 0xf54505,      // M.E.A.T. Orange
      voting: 0x43b581,       // Grün (Voting)
      clips: 0xf04747,        // Rot (Clip)
      events: 0xfaa61a,       // Gelb (Event)
      feedback: 0x9b59b6,     // Lila
      quiz: 0x00bcd4,         // Türkis
      profile: 0x00aced,      // Hellblau
      sentinel: 0x607d8b,     // Grau
      vault: 0x795548,        // Braun
      default: 0x747f8d       // Fallback / Standardgrau
    };
    return map[module] ?? map.default;
  }
  