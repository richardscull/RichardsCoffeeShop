import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('stop')
    .setDescription('Закончить проигрывать музыку');
};

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  //TODO: Clear queue
  if (!interaction.inCachedGuild()) return;
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  guildPlayer?.player.stop();
  console.log('Player stopped!');
}
