export function getModuleIconURL(module: string): string {
    const map: Record<string, string> = {
      general: "https://i.imgur.com/ay0fkPx.png",
      voting: "https://i.imgur.com/ay0fkPx.png",
      clips: "https://i.imgur.com/ay0fkPx.png",
      events: "https://i.imgur.com/ay0fkPx.png",
      feedback: "https://i.imgur.com/ay0fkPx.png",
      quiz: "https://i.imgur.com/ay0fkPx.png",
      profile: "https://i.imgur.com/ay0fkPx.png",
      sentinel: "https://i.imgur.com/ay0fkPx.png",
      vault: "https://i.imgur.com/ay0fkPx.png",
      default: "https://i.imgur.com/ay0fkPx.png"
    };
    return map[module] ?? map.default;
  }
  