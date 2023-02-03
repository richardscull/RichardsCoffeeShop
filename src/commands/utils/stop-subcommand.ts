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
  if (!interaction.inCachedGuild()) return;
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;
  guildPlayer.queue = [];
  guildPlayer.audioPlayer.stop();
  interaction.reply({
    content: '> 👍 Плеер был успешно остановлен!',
    ephemeral: true,
  });
}
