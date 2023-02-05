import { AudioPlayerPlayingState } from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand.setName('pause').setDescription('Функция паузы трека');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;
  const { audioPlayer, status } = guildPlayer;
  const playerState = audioPlayer.state as AudioPlayerPlayingState;
  playerState.status === 'playing'
    ? audioPlayer.pause()
    : audioPlayer.unpause();

  const getEmbed = client.successEmbed(
    `🌿 Плеер был успешно ${
      status.isPaused ? 'снят с паузы!' : 'поставлен на паузу!'
    }`
  );

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
