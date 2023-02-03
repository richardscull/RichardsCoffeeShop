import {
  AudioPlayerPlayingState,
  AudioPlayerStatus,
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
import play, { SpotifyTrack, YouTubeVideo } from 'play-dl';
import { millisecondsToString, numberWithDots } from '../../utils';
import { guildObject } from '../../client/ExtendedClient';

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
  const userInputUrl = await validateUrl(userInput);
  let userSongUrl = '';

  if (typeof userInputUrl === 'string') {
    if (userInputUrl === 'error')
      return console.error('unhandled error in music');
    userSongUrl = userInputUrl;
  }

  if (userInputUrl instanceof ActionRowBuilder<StringSelectMenuBuilder>) {
    const getUserChoice = await handleStringSearch(userInputUrl, interaction);
    userSongUrl = getUserChoice;
  }

  const audioResource = await urlToAudioResource(userSongUrl);
  const guildPlayer = (await client.getGuildPlayer(interaction.guildId))
    ? await client.getGuildPlayer(interaction.guildId)
    : await createGuildPlayer(interaction, client);

  if (!guildPlayer || !audioResource) return;

  guildPlayer.queue.push(userSongUrl);

  if (!interaction.replied)
    interaction.reply({
      content: '> 🌿 Песня была успешно добавлена в очередь!',
      ephemeral: true,
    });

  if (guildPlayer.queue.length < 2) guildPlayer.audioPlayer.play(audioResource);
}

async function validateUrl(url: string) {
  let spData;
  let searchResult;

  if (play.sp_validate(url) !== 'search' && play.is_expired())
    await play.refreshToken();

  switch (play.sp_validate(url)) {
    case 'track':
      spData = (await play.spotify(url)) as SpotifyTrack;
      searchResult = await play.search(
        `${spData.artists[0].name} ${spData.name}`,
        { limit: 1 }
      );
      return searchResult[0].url;
    case 'playlist': //To Implement
    case 'album': //To Implement
  }

  if (play.yt_validate(url) === 'video') return url;
  if (play.yt_validate(url) === 'search') {
    searchResult = await play.search(url, { limit: 5 });
    if (!searchResult) return 'error';
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('videoSelect')
        .setPlaceholder('Результаты по вашему запросу')
        .setOptions(
          searchResult.map((video) => ({
            label: video.title ? video.title.slice(0, 99) : '',
            description: `⌛: ${video.durationRaw} | 👀: ${numberWithDots(
              video.views
            )} | 🗓️: ${video.uploadedAt}`,
            value: video.id ? video.id.slice(0, 99) : '',
          }))
        )
    );
  }
}

async function createGuildPlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const { channel, member, guildId, guild } = interaction;
  const textChannel = channel;
  const memberVoice = member.voice.channel;
  if (!textChannel || !memberVoice) return;
  if (textChannel.isThread() || textChannel.type !== ChannelType.GuildText) {
    interaction.reply({
      content: `🙏 Извините, но вы не можете использовать тут эту команду.`,
      ephemeral: true,
    });
    return;
  }

  const voiceConnection = joinVoiceChannel({
    channelId: memberVoice.id,
    guildId: guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  let embedInterval: NodeJS.Timeout;

  audioPlayer.on(AudioPlayerStatus.Playing, async () => {
    const guildPlayer = await client.getGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;
    const { embed, status, audioPlayer, queue } = guildPlayer;
    const videoData = (await play.video_info(queue[0])).video_details;

    embed.playerEmbed = createMusicEmbed(guildPlayer, videoData);

    if (!embed.playerMessage && interaction.channel) {
      embed.playerMessage = await interaction.channel.send({
        embeds: [embed.playerEmbed],
      });
      embed.playerThread = await embed.playerMessage.startThread({
        name: '🔊 Музыкальный плеер',
      });
    } else if (embed.playerMessage) {
      embed.playerMessage?.edit({ embeds: [embed.playerEmbed] });
    }

    embedInterval = setInterval(async () => {
      if (!embed.playerMessage) return;
      const playerState = audioPlayer.state as AudioPlayerPlayingState;
      const { playbackDuration } = playerState;

      if (!embed.playerEmbed || !embed.playerMessage) return;

      embed.playerMessage?.edit({
        embeds: [
          embed.playerEmbed
            .setDescription(
              `${status.isPaused ? '⏸ | ' : ''}${
                status.onRepeat ? '🔁 | ' : ''
              }` +
                `⌛ ${millisecondsToString(playbackDuration)} ${progressBar(
                  playbackDuration,
                  videoData.durationInSec * 1000,
                  10
                )} ${videoData.durationRaw}`
            )
            .setFooter({
              text: `👤 Автор: ${videoData.channel} ${
                queue.length - 1
                  ? `| 🎼 Треков в очереди: ${queue.length - 1}`
                  : ''
              }`,
            }),
        ],
      });
    }, 30000); //30s timer
  });

  audioPlayer.on(AudioPlayerStatus.Idle, async () => {
    const guildPlayer = await client.getGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;
    const { embed, status, queue } = guildPlayer;
    const { playerEmbed, playerMessage, playerThread } = embed;
    clearInterval(embedInterval);

    if (!status.onRepeat) queue.shift();
    if (queue.length) {
      const audioResource = await urlToAudioResource(queue[0]);
      return guildPlayer.audioPlayer.play(audioResource);
    } else if (playerEmbed) {
      playerEmbed.setDescription(`🌧 Плеер закончил свою работу`);
      playerMessage?.edit({ embeds: [playerEmbed] });
      client.musicPlayer.delete(guildId);
      playerThread?.delete();
      return voiceConnection.destroy();
    }
  });

  voiceConnection.subscribe(audioPlayer);

  client.musicPlayer.set(guildId, {
    voiceConnection: voiceConnection,
    audioPlayer: audioPlayer,
    embed: {},
    queue: [],
    status: {
      isPaused: false,
      onRepeat: false,
    },
  });

  return await client.getGuildPlayer(guildId);
}

async function urlToAudioResource(trackURL: string) {
  const stream = await play.stream(trackURL);
  return createAudioResource(stream.stream, {
    inputType: stream.type,
  });
}

async function handleStringSearch(
  searchResults: ActionRowBuilder<StringSelectMenuBuilder>,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const selectMenu = interaction.reply({
    components: [searchResults],
    ephemeral: true,
  });

  return (await selectMenu)
    .awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      dispose: true,
    })
    .then(async (interaction) => {
      const videoData = await play.video_basic_info(interaction.values[0]);
      interaction.update({
        content: `> 🌿 Трек ${videoData.video_details.title} был успешно добавлен!`,
        components: [],
      });

      return interaction.values[0];
    });
}

function createMusicEmbed(guildPlayer: guildObject, videoData: YouTubeVideo) {
  const { title, url, thumbnails, channel, durationRaw, durationInSec } =
    videoData;
  const { status, queue } = guildPlayer;
  return new EmbedBuilder()
    .setColor('#cd243b')
    .setAuthor({
      name: '🔊 Сейчас играет',
      iconURL:
        'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.gif',
    })
    .setTitle(`${title}`)
    .setURL(url)
    .setDescription(
      `${status.isPaused ? '⏸ | ' : ''}${
        status.onRepeat ? '🔁 | ' : ''
      }⌛ 00:00 ${progressBar(0, durationInSec * 1000, 10)} ${durationRaw}`
    )
    .setThumbnail(thumbnails[3].url)
    .setFooter({
      text: `👤 Автор: ${channel} ${
        queue.length - 1 ? `| 🎼 Треков в очереди: ${queue.length - 1}` : ''
      }`,
    });
}

function progressBar(value: number, maxValue: number, size: number) {
  const percentage = value / maxValue;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;

  return `<:ProgressBarStart:973650912788746301>${'<:Playing:973650912906190848>'.repeat(
    progress
  )}<:ProgressBarMedium:973650912293847041>${'<:ProgressBarWaiting:973650912755195974>'.repeat(
    emptyProgress
  )}<:ProgressBarEnd:973650912755208212>`;
}
