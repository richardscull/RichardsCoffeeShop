import { SlashCommandBuilder } from '@discordjs/builders';
import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { ChatInputCommandInteraction } from 'discord.js';
import play from 'play-dl';

export const data = new SlashCommandBuilder()
  .setName('music')
  .setDescription('Music commands')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('play')
      .setDescription('Начать проигрывать музыку')
      .addStringOption((option) =>
        option
          .setName('track')
          .setDescription('Введите трек или URL (Youtube)')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) return;
  const memberInVoice = interaction.member.voice?.channel;
  const commandName = interaction.options.getSubcommand();
  if (!memberInVoice) {
    await interaction.editReply({
      content:
        '❌ Вы должны находиться в голосовом канале, чтобы использовать эту команду!',
    });
    return;
  } else if (commandName != 'play') {
    if (memberInVoice && !memberInVoice.members.has(interaction.client.user.id))
      return interaction.editReply(
        `🚧 Плеер еще не запущен, либо вы находитесь не в том же голосовом канале с ботом!`
      );
  }

  switch (commandName) {
    case 'play': {
      if (!interaction.options.getString('track')) break;
      const trackURL = interaction.options.getString('track');
      const connection = joinVoiceChannel({
        channelId: memberInVoice.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const yt_info = await play.search(trackURL as string, {
        limit: 1,
      });

      const stream = await play.stream(yt_info[0].url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });

      player.play(resource);

      connection.subscribe(player);
      break;
    }

    default: {
      throw new Error();
    }
  }
  interaction.reply('Pong!');
}
