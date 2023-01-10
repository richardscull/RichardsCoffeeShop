import { SlashCommandBuilder } from '@discordjs/builders';
import {
  AudioPlayerStatus,
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

  //
  // WARNING: RAW CODE DOWN THERE
  // WILL BE REWRITTEN SOON 💀
  //

  switch (commandName) {
    case 'play': {
      if (!interaction.options.getString('track')) break;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const trackURL = interaction.options.getString('track')!;
      const connection = joinVoiceChannel({
        channelId: memberInVoice.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      console.log(play.yt_validate(trackURL));
      console.log(play.sp_validate(trackURL));
      let stream;
      if (
        play.sp_validate(trackURL) !== 'search' &&
        play.sp_validate(trackURL)
      ) {
        if (play.is_expired()) {
          await play.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
        }
        const sp_data = await play.spotify(trackURL); // This will get spotify data from the url [ I used track url, make sure to make a logic for playlist, album ]
        console.log(sp_data);
        const searched = await play.search(`${sp_data.name}`, {
          limit: 1,
        }); // This will search the found track on youtube.
        stream = await play.stream(searched[0].url); // This will create stream from the above search
      } else if (play.yt_validate(trackURL)) {
        const yt_info = await play.search(trackURL as string, {
          limit: 1,
        });
        console.log(yt_info);
        stream = await play.stream(yt_info[0].url);
      } else {
        return interaction.reply('No match for this url :(');
      }
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });
      player.play(resource);
      player.on(AudioPlayerStatus.Idle, async () => {
        return connection.destroy();
      });
      connection.subscribe(player);
      interaction.reply('Pong!');

      break;
    }
    default: {
      throw new Error();
    }
  }
}
