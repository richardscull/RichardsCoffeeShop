/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
//import { client } from '../../client/index';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Will answer');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
  interaction.editReply(
    `Pong! \n${sent.createdTimestamp - interaction.createdTimestamp}ms`
  );
}
