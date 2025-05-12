import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getRecentMatchesForSummoner } from "@api/games/league/match.js";

export const data = new SlashCommandBuilder()
  .setName("lol")
  .setDescription("League of Legends Befehle")
  .addSubcommand((sub) =>
    sub
      .setName("matchhistory")
      .setDescription("Zeigt die letzten Matches eines Spielers (EUW)")
      .addStringOption((opt) =>
        opt
          .setName("summoner")
          .setDescription("Summoner-Name (z. B. FakerEUW)")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const region = "euw"; // festgesetzt
  const summonerName = interaction.options.getString("summoner", true);

  await interaction.deferReply();

  try {
    const { summoner, matches } = await getRecentMatchesForSummoner(region, summonerName);

    const embed = new EmbedBuilder()
      .setTitle(`🧾 Match-History von ${summoner.name}`)
      .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/13.6.1/img/profileicon/${summoner.profileIconId}.png`)
      .setFooter({ text: `Level ${summoner.summonerLevel} | EUW` })
      .setColor(matches[0]?.win ? 0x00ff88 : 0xff3344);

    for (const match of matches) {
      embed.addFields({
        name: `🏹 ${match.champion} – ${match.win ? "Sieg" : "Niederlage"}`,
        value: `Mode: ${match.gameMode} | K/D/A: ${match.kills}/${match.deaths}/${match.assists} | Dauer: ${Math.floor(match.time / 60)}m`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error(error);

    if (error.response?.status === 403) {
      return interaction.editReply("❌ Der Riot API Key scheint ungültig oder abgelaufen zu sein.");
    }

    if (error.response?.status === 404) {
      return interaction.editReply("❌ Beschwörer nicht gefunden. Bitte überprüfe den Namen.");
    }

    await interaction.editReply("❌ Fehler beim Abrufen der Matchdaten. Prüfe den Namen und die Region.");
  }
}
