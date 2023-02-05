import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('repeat')
    .setDescription('Функция зацикливания трека');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { status } = guildPlayer;
  status.onRepeat = status.onRepeat ? false : true;

  const getEmbed = client.successEmbed(
    `🌿 Функция зацикливания ${status.onRepeat ? 'включена!' : 'выключена!'}`
  );

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
