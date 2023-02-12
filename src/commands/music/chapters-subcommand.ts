import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import play from 'play-dl';

import { ExtendedClient } from '../../client/ExtendedClient';
import { createMenuReply } from '../../utils/selectMenuHandler';
import { stringMenuOption } from '../../utils';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand.setName('chapters').setDescription('негры пидорасы');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { queue } = guildPlayer;
  const songToPlay = queue[0].song;
  const videoData = (await play.video_info(queue[0].song)).video_details;

  if (videoData.chapters.length === 0)
    return await interaction.editReply({
      embeds: [client.errorEmbed(`❌ У этого ролика нету глав!`)],
    });

  const map = videoData.chapters.map((chapter, index) => ({
    label: chapter.title.slice(0, 99),
    description: `⌛: ${chapter.timestamp}`,
    value: index.toString(),
  }));

  await createMenuReply(interaction, map, handleUserChoice);

  async function handleUserChoice(
    choiceDes: stringMenuOption,
    interactionMenu: StringSelectMenuInteraction<CacheType>
  ) {
    if (!guildPlayer) return;

    if (queue[0].song === songToPlay) {
      interactionMenu.update({
        components: [],
        embeds: [
          client.successEmbed(`🌿 Переключаемся на главу ${choiceDes.label}`),
        ],
      });

      queue.splice(1, 0, {
        song: queue[0].song,
        user: queue[0].user,
        seek: videoData.chapters[parseInt(choiceDes.value)].seconds,
      });

      return guildPlayer.audioPlayer.stop();
    } else {
      return interactionMenu.update({
        components: [],
        embeds: [client.errorEmbed(`❌ Пока вы выбирали, трек был изменен!`)],
      });
    }
  }
}
