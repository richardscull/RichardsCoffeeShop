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
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';

import { ExtendedClient } from '../../client/ExtendedClient';
import play, { SpotifyTrack, YouTubeVideo } from 'play-dl';
import { millisecondsToString, numberWithDots } from '../../utils';

import { client } from '../../client';
import { createMusicEmbed, createProgressBar } from './embedsHandler';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('play')
    .setDescription('Начать проигрывать музыку')
    .addStringOption((option) =>
      option
        .setName('track')
        .setDescription('Введите название музыки или URL (Youtube, Spotify)')
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

  guildPlayer.queue.push({
    user: `${interaction.user.username}#${interaction.user.discriminator}`,
    song: userSongUrl,
  });
  if (!interaction.replied) {
    const videoData = (await play.video_info(userSongUrl)).video_details;
    await interaction.editReply({
      embeds: [
        client.successEmbed(
          `🌿 Песня ${videoData.title} была успешно добавлена в очередь!`
        ),
      ],
    });
  }
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
    const filteredResult: YouTubeVideo[] = [];
    const searchResult = await play.search(url, {
      limit: 30,
      source: { youtube: 'video' },
    });
    searchResult.forEach((element) => {
      if (filteredResult.length !== 5 && element.uploadedAt)
        filteredResult.push(element);
    });
    if (!filteredResult) return 'error';
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('videoSelect')
        .setPlaceholder('Результаты по вашему запросу')
        .setOptions(
          filteredResult.map((video) => ({
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
    interaction.editReply({
      embeds: [
        client.errorEmbed(
          `🙏 Извините, но вы не можете использовать тут эту команду.`
        ),
      ],
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

  audioPlayer.on(AudioPlayerStatus.Paused, async () => {
    const guildPlayer = await client.getGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;
    guildPlayer.status.isPaused = true;
  });

  audioPlayer.on(AudioPlayerStatus.Playing, async () => {
    const guildPlayer = await client.getGuildPlayer(interaction.guildId);

    if (!guildPlayer) return;

    const { embed, status, audioPlayer, queue } = guildPlayer;

    const videoData = (await play.video_info(queue[0].song)).video_details;

    if (status.isPaused) return (status.isPaused = false);

    embed.playerEmbed = await createMusicEmbed(guildPlayer, videoData);

    if (!embed.playerMessage && interaction.channel && embed.playerEmbed) {
      embed.playerMessage = await interaction.channel.send({
        embeds: [embed.playerEmbed],
      });

      embed.playerThread = await embed.playerMessage.startThread({
        name: '🔊 Музыкальный плеер',
      });
    } else if (embed.playerMessage && embed.playerEmbed && embed.playerThread) {
      embed.playerMessage?.edit({ embeds: [embed.playerEmbed] });
    }

    // if (embed.playerThread) await sendSongEmbed(embed.playerThread, videoData);

    embedInterval = setInterval(async () => {
      try {
        if (!embed.playerMessage) return;
        if (embed.playerMessage.embeds.length < 0)
          return embed.playerMessage.delete();

        const playerState = audioPlayer.state as AudioPlayerPlayingState;

        let { playbackDuration } = playerState;
        playbackDuration = queue[0].seek
          ? playbackDuration + queue[0].seek * 1000
          : playbackDuration;

        const progressBar = await createProgressBar(
          playbackDuration,
          videoData.durationInSec * 1000,
          8
        );

        if (!embed.playerEmbed || !embed.playerMessage) return;

        await embed.playerMessage?.edit({
          embeds: [
            embed.playerEmbed
              .setDescription(
                `${status.isPaused ? '⏸ | ' : ''}${
                  status.onRepeat ? '🔁 | ' : ''
                }` +
                  `🎧 ${millisecondsToString(
                    playbackDuration
                  )} ${progressBar} ${videoData.durationRaw}`
              )
              .setFooter({
                text: `📨 Запросил: ${queue[0].user} ${
                  queue.length - 1
                    ? `| 🎼 Треков в очереди: ${queue.length - 1}`
                    : ''
                }`,
              }),
          ],
        });
      } catch {
        //Empty try/catch, to handle invalid message edit requests.
      }
    }, 30 * 1000); //30s timer
  });

  audioPlayer.on(AudioPlayerStatus.Idle, async () => {
    clearInterval(embedInterval);

    const guildPlayer = await client.getGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;
    const { embed, status, queue } = guildPlayer;
    const { playerEmbed, playerMessage, playerThread } = embed;

    if (!status.onRepeat) queue.shift();

    if (queue.length) {
      const audioResource = await urlToAudioResource(
        queue[0].song,
        queue[0]?.seek
      );
      return guildPlayer.audioPlayer.play(audioResource);
    } else if (playerEmbed) {
      playerEmbed.setDescription(`🌧 Плеер закончил свою работу`);
      try {
        await playerMessage?.edit({ embeds: [playerEmbed] });
      } finally {
        client.deleteGuildPlayer(guildId);
        playerThread?.delete();
      }
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

export async function urlToAudioResource(trackURL: string, seek?: number) {
  const stream = await play.stream(trackURL, { seek: seek });
  return createAudioResource(stream.stream, {
    inputType: stream.type,
  });
}

export async function handleStringSearch(
  searchResults: ActionRowBuilder<StringSelectMenuBuilder>,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const selectMenu = interaction.editReply({
    components: [searchResults],
  });

  return (await selectMenu)
    .awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      dispose: true,
    })
    .then(async (interaction) => {
      const videoData = await play.video_basic_info(interaction.values[0]);
      interaction.update({
        components: [],
        embeds: [
          client.successEmbed(
            `🌿 Трек ${videoData.video_details.title} был успешно добавлен!`
          ),
        ],
      });

      return interaction.values[0];
    });
}
