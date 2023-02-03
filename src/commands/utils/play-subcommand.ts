import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import {
  ActionRowBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import play, { SpotifyPlaylist, SpotifyTrack } from 'play-dl';
import { numberWithDots } from '../../utils';

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
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const userInput = interaction.options.getString('track', true);
  const trackURL = await validateUrl(userInput);

  let audioResource: AudioResource<null> | null = null;

  if (typeof trackURL === 'string') {
    if (trackURL === 'error') return console.error('unhandled error in music');
    console.log(trackURL);
    audioResource = await handleSingleUrl(trackURL);
  }

  if (trackURL instanceof ActionRowBuilder<StringSelectMenuBuilder>) {
    audioResource = await handleStringSearch(trackURL, interaction);
  }

  const guildPlayer = (await client.getGuildPlayer(interaction.guildId))
    ? await client.getGuildPlayer(interaction.guildId)
    : await createGuildPlayer(interaction, client);
  if (!guildPlayer || !audioResource) return;
  guildPlayer.audioPlayer.play(audioResource);
  return;
}

async function validateUrl(url: string) {
  // Check if Spotify token expired or not
  if (play.sp_validate(url) !== 'search' && play.sp_validate(url))
    if (play.is_expired()) await play.refreshToken();

  // Logic for Spotify track URL
  if (play.sp_validate(url) === 'track') {
    const sp_data = (await play.spotify(url)) as SpotifyTrack;
    const searched = await play.search(
      `${sp_data.artists[0].name} ${sp_data.name}`,
      {
        limit: 1,
      }
    );
    return searched[0].url;
  }

  //TODO: Logic for Spotify playlist and album URL
  if (
    play.sp_validate(url) === 'playlist' ||
    play.sp_validate(url) === 'album'
  ) {
    console.log('test');
    const sp_data = await play.spotify(url);
    console.log(sp_data as SpotifyPlaylist);
    const searched = await play.search(` ${sp_data.name}`, {
      limit: 1,
    });
    return searched[0].url;
  }

  if (play.yt_validate(url) === 'video') {
    return url;
  }

  if (play.yt_validate(url) === 'search') {
    const yt_info = await play.search(url, {
      limit: 5,
    });
    if (!yt_info) return 'error';

    const searchResult: { label: string; description: string; value: string }[] = [];
    yt_info.forEach((video) => {
      {
        searchResult.push({
          label: video.title ? video.title.slice(0, 99) : '',
          description: `⌛: ${video.durationRaw} | 👀: ${numberWithDots(
            video.views
          )} | 🗓️: ${video.uploadedAt}`,
          value: video.id ? video.id.slice(0, 99) : '',
        });
      }
    });
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('videoSelect')
        .setPlaceholder('Результаты по вашему запросу')
        .setOptions(searchResult)
    );
  }
}

async function createGuildPlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const textChannel = interaction.channel!;
  const memberVoice = interaction.member.voice.channel;
  const threadEmbed = new EmbedBuilder()
    .setTimestamp()
    .setColor('#6a0cee')
    .setAuthor({
      name: `${interaction.user.tag}`,
      iconURL: `${interaction.user.displayAvatarURL()}`,
    });

  if (textChannel.isThread() || textChannel.type !== ChannelType.GuildText) {
    interaction.reply({
      content: `🙏 Извините, но вы не можете использовать тут эту команду.`,
      ephemeral: true,
    });
    return;
  }

  if (!memberVoice) return;
  const voiceConnection = joinVoiceChannel({
    channelId: memberVoice.id,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  });

  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  let embedInterval: NodeJS.Timeout;

  audioPlayer.once(AudioPlayerStatus.Playing, async () => {
    embedInterval = setInterval(async () => {
      //Will be removed in next versions
      console.log(new Date());
    }, 30000); //30s timer
  });

  audioPlayer.on(AudioPlayerStatus.Idle, async () => {
    client.musicPlayer.delete(interaction.guildId);
    if (embedInterval) clearInterval(embedInterval);
    return voiceConnection.destroy();
  });

  voiceConnection.subscribe(audioPlayer);

  client.musicPlayer.set(interaction.guildId, {
    voiceConnection: voiceConnection,
    audioPlayer: audioPlayer,
    embed: threadEmbed,
    status: {
      isPaused: false,
      onRepeat: false,
    },
  });

  return await client.getGuildPlayer(interaction.guildId);
}

async function handleSingleUrl(trackURL: string) {
  const stream = await play.stream(trackURL);
  return createAudioResource(stream.stream, {
    inputType: stream.type,
  });
}

async function handleStringSearch(
  trackURL: ActionRowBuilder<StringSelectMenuBuilder>,
  interaction: ChatInputCommandInteraction<'cached'>
): Promise<AudioResource<null>> {
  const selectMenu = interaction.reply({
    components: [trackURL],
    ephemeral: true,
  });

  return (await selectMenu)
    .awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      dispose: true,
    })
    .then(async (interaction) => {
      const stream = await play.stream(interaction.values[0]);
      const videoData = await play.video_basic_info(interaction.values[0]);

      interaction.update({
        content: `> 🌿 Track ${videoData.video_details.title} successfully queued!`,
        components: [],
      });

      return createAudioResource(stream.stream, {
        inputType: stream.type,
      });
    });
}
