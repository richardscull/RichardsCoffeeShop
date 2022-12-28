import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Will answer");

export async function execute(interaction: ChatInputCommandInteraction) {
  return interaction.reply("haha.. what");
}
