/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { client } from '../../client/index';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Will answer');

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(interaction.guildId);
  if (!interaction.guildId) return;
  let GuildDB = await client.GetGuild(interaction.guildId);
  console.log(GuildDB);
  if (!GuildDB) {
    
    console.log('No GuildDB');
    const guildid = interaction.guildId ? interaction.guildId : 'test';
    await client.database.guild.set(guildid, {
      admin: interaction.guild?.ownerId,
    });
    GuildDB = await client.GetGuild(guildid);
  } else {
    console.log('Everything is okay');
  }

  const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
  interaction.editReply(
    `Pong! \n${sent.createdTimestamp - interaction.createdTimestamp}ms`
  );
}
