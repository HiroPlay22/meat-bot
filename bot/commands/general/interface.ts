import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { createStandardEmbed } from "@utils/style/createStandardEmbed";
import { incrementUsage } from "@services/internal/commandStat.service";

export const data = new SlashCommandBuilder()
  .setName("interface")
  .setDescription("Zeigt alle möglichen Discord-Komponenten im Demo-Embed");

export async function execute(interaction: ChatInputCommandInteraction) {
  const usageCount = await incrementUsage("interface");

  const embed = createStandardEmbed({
    module: "general",
    moduleName: "interface",
    user: interaction.user,
    title: "🧪 UI-Komponenten-Demo",
    bodyText: "Dies ist eine Vorschau aller Discord-Komponenten.",
    usageCount,
    latency: interaction.client.ws.ping,
    botPersona: "M.E.A.T."
  });

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("demo_primary").setLabel("Primary").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("demo_secondary").setLabel("Secondary").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("demo_success").setLabel("Success").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("demo_danger").setLabel("Danger").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setURL("https://discord.com").setLabel("Link").setStyle(ButtonStyle.Link)
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("demo_dropdown")
    .setPlaceholder("Wähle eine Option")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("Option A").setValue("A"),
      new StringSelectMenuOptionBuilder().setLabel("Option B").setValue("B"),
      new StringSelectMenuOptionBuilder().setLabel("Mehrfachauswahl").setValue("multi").setDescription("Kann kombiniert werden")
    );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const modalButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("open_modal")
      .setLabel("📨 Formular öffnen")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: "🧪 Interface-Demo geladen:",
    embeds: [embed],
    components: [buttonRow, selectRow, modalButtonRow],
    ephemeral: false
  });
}
