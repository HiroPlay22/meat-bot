// Pfad: bot/modules/gpt/games/ARK/generateDinoNames.ts

import { openai } from "@/lib/gpt/client.js";
import { ChatCompletionRequestMessage } from "@/lib/gpt/openai.js";

export async function generateDinoNames({
  dinoName,
  traits,
  style
}: {
  dinoName: string;
  traits: string[];
  style: string;
}): Promise<string[]> {
  const systemPrompt = `Du bist ein kreativer Namensgenerator für ARK-Dinosaurier im Stil eines KI-Bots namens M.E.A.T.`;

  const userPrompt = `Ich brauche 5 einzigartige, witzige oder stilvolle Namensvorschläge für einen Dino vom Typ "${dinoName}".
Eigenschaften: ${traits.map((t) => `"${t}"`).join(", " )}.
Stilrichtung: "${style}"

Die Namen sollen originell sein, gut aussprechbar und maximal 2 Wörter lang sein. Keine Wiederholungen.`;

  const messages: ChatCompletionRequestMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    temperature: 0.9,
  });

  const resultText = response.choices[0].message.content ?? "";

  const names = resultText
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => !!line);

  return names;
}
