import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { stopAudioPlayer } from './stop-subcommand';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('skip')
    .setDescription('Функция пропуска текущего трека в очереди')
    .addIntegerOption((option) =>
      option
        .setName('times')
        .setDescription('Укажите число треков для пропуска')
        .setRequired(false)
    );
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const timesToSkip = interaction.options.getInteger('times');
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  if (timesToSkip) guildPlayer.queue = guildPlayer.queue.slice(timesToSkip - 1);

  if (guildPlayer.status.onRepeat) {
    guildPlayer.queue.shift();
  }

  const { queue } = guildPlayer;
  if (queue.length < 2) {
    await stopAudioPlayer(interaction, client, guildPlayer);
  } else {
    guildPlayer.status.isPaused = false;
    guildPlayer.audioPlayer.stop(true);
  }

  const getEmbed = client.successEmbed(
    timesToSkip
      ? `✅ ${timesToSkip} треков было пропущен!`
      : `✅ Текущий трек был пропущен!`
  );

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
