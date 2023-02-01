import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import play from 'play-dl';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('play')
    .setDescription('Начать проигрывать музыку')
    .addStringOption((option) =>
      option
        .setName('track')
        .setDescription('Введите трек или URL (Youtube)')
        .setRequired(true)
    );
};

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  const threadEmbed = new EmbedBuilder()
    .setTimestamp()
    .setColor('#6a0cee')
    .setAuthor({
      name: `${interaction.user.tag}`,
      iconURL: `${interaction.user.displayAvatarURL()}`,
    });

  if (!interaction.inCachedGuild()) return;
  let guildPlayer = await client.getGuildPlayer(interaction.guildId);
  const memberVoice = interaction.member.voice.channel;
  if (!guildPlayer) {
    if (
      interaction.channel?.isThread() ||
      interaction.channel?.type !== ChannelType.GuildText
    ) {
      interaction.editReply(
        `🙏 Извините, но вы не можете использовать тут эту команду.`
      );
      return;
    }

    if (!memberVoice) return;
    const connection = joinVoiceChannel({
      channelId: memberVoice.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    let embedInterval: NodeJS.Timeout;

    player.on(AudioPlayerStatus.Idle, async () => {
      client.musicPlayer.delete(interaction.guildId);
      if (embedInterval) clearInterval(embedInterval);
      return connection.destroy();
    });

    player.once(AudioPlayerStatus.Playing, async () => {
      embedInterval = setInterval(async () => {
        //Will be removed in next versions
        console.log(new Date());
      }, 15000); //15s timer
    });

    connection.subscribe(player);

    client.musicPlayer.set(interaction.guildId, {
      connection: connection,
      player: player,
      embed: threadEmbed,
      status: {
        isPaused: false,
        onRepeat: false,
      },
    });

    guildPlayer = await client.getGuildPlayer(interaction.guildId);
  }
  const userURL = interaction.options.getString('track', true);
  const trackURL = await validateUrl(userURL);
  const stream = await play.stream(trackURL);
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });
  guildPlayer?.player.play(resource);
}

async function validateUrl(url: string) {
  // Check if Spotify token expired or not
  if (play.sp_validate(url) !== 'search' && play.sp_validate(url))
    if (play.is_expired()) await play.refreshToken();

  // Logic for Spotify track URL
  if (play.sp_validate(url) === 'track') {
    const sp_data = await play.spotify(url);
    const searched = await play.search(`${sp_data.name}`, {
      limit: 1,
    });
    return searched[0].url;
  }
  //TODO: Logic for Spotify playlist and album URL
  if (
    play.sp_validate(url) === 'playlist' ||
    play.sp_validate(url) === 'album'
  ) {
    const sp_data = await play.spotify(url);
    const searched = await play.search(`${sp_data.name}`, {
      limit: 1,
    });
    return searched[0].url;
  }
  if (play.yt_validate(url) === 'video') {
    return url;
  }

  if (play.yt_validate(url) === 'search') {
    const yt_info = await play.search(url, {
      limit: 1,
    });
    return yt_info[0].url;
  }
  return 'error';
}
