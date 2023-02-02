import axios from 'axios';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  time,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import {
  osuProfile,
  secondsToDhm,
  getOsuClientToken,
  numberWithSpaces,
  checkUserAcessToken,
} from '../../utils';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('profile')
    .setDescription('Посмотреть свой osu!профиль')
    .addStringOption((option) =>
      option
        .setName('username')
        .setRequired(false)
        .setDescription('Посмотреть чей-то другой osu! профиль')
    )
    .addStringOption((option) =>
      option
        .setName('server')
        .setRequired(false)
        .setDescription('Выбрать osu! сервер')
        .addChoices(
          { name: 'bancho', value: 'bancho' },
          { name: 'gatari', value: 'gatari' }
        )
    );
};

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  const getInputUsername = interaction.options.getString('username');
  const getInputServer = interaction.options.getString('server');
  const getUserAcessToken = await checkUserAcessToken(
    interaction.user.id,
    await client.getOsuAccount(interaction.user.id)
  );
  if (!getInputUsername && !getUserAcessToken) {
    const loginUrlButton = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setURL(client.ngrokUrl)
        .setLabel('📋 Войти в аккаунт')
        .setStyle(ButtonStyle.Link)
    );
    const needToLogin = new EmbedBuilder()
      .setTitle('🍜 Произошла ошибка!')
      .setDescription(
        `Для того что-бы посмотреть свой профиль, вам требуется войти в свой аккаунт!\n` +
          `Если у вас нету возможности зарегестрироваться, то вы можете посмотреть свой аккаунт введя в дополнительное поле команды ваш никнейм`
      );
    interaction.reply({
      embeds: [needToLogin],
      components: [loginUrlButton],
      ephemeral: true,
    });
    return;
  }

  /*   TODO: Implement gatari server profiles 
  Docs: https://osu.gatari.pw/docs/api */
  if (getInputServer === 'gatari' && getInputUsername) {
    await interaction.reply({
      content: '🪴 Скоро будет добавлено...',
      ephemeral: true,
    });
    return;
  }

  if (getInputUsername) {
    await axios
      .get<osuProfile>(
        `https://osu.ppy.sh/api/v2/users/${getInputUsername}/osu`,
        {
          params: {
            key: 'user',
          },
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getOsuClientToken()}`,
          },
        }
      )
      .then(async (response) => {
        await interaction.reply({
          embeds: [jsonProfileToEmbed(response.data)],
        });
      })
      .catch(async () => {
        await interaction.reply({
          content: 'Указанный пользователь не найден!',
          ephemeral: true,
        });
      });
    return;
  }

  if (getUserAcessToken) {
    const userProfileJSON = await axios.get<osuProfile>(
      //TODO: Add custom default modes
      `https://osu.ppy.sh/api/v2/me/osu`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getUserAcessToken}`,
        },
      }
    );
    await interaction.reply({
      embeds: [jsonProfileToEmbed(userProfileJSON.data)],
    });
    return;
  }
}

//TODO: Redesign later
function jsonProfileToEmbed(profile: osuProfile) {
  const profileEmbed = new EmbedBuilder()
    .setAuthor({
      name: `Профиль игрока ${profile.username}${
        profile.is_supporter ? ' ✨' : ''
      }`,
      iconURL: profile.avatar_url,
      url: 'https://osu.ppy.sh/users/' + profile.id,
    })
    .setColor('NotQuiteBlack')
    .setImage(profile.cover_url)
    .setDescription(
      `Статус: ${
        profile.is_online
          ? '🌿 **В сети!**'
          : `🍂 **Оффлайн!**\nБыл в сети: **${
              profile.last_visit
                ? time(new Date(profile.last_visit).getTime() / 1000, 'R')
                : 'Нету данных!'
            }**`
      }\n` +
        `Дата регистрации: **${time(
          new Date(profile.join_date).getTime() / 1000,
          'D'
        )}**
        ${
          profile.statistics.global_rank
            ? `Рейтинг на Bancho!: **#${numberWithSpaces(
                profile.statistics.global_rank
              )} (:flag_${profile.country_code.toLowerCase()}:: #${numberWithSpaces(
                profile.statistics.country_rank
              )})**`
            : `Рейтинг на Bancho!: **Нету данных!**`
        }`
    )
    .setFields(
      {
        name: 'Медалей 🏆',
        value: `**${profile.user_achievements.length}**`,
        inline: true,
      },
      {
        name: 'PP 📈',
        value: `**${Math.floor(profile.statistics.pp)}**`,
        inline: true,
      },
      {
        name: 'Времени в игре ⌛',
        value: `**${secondsToDhm(profile.statistics.play_time)} (${Math.round(
          profile.statistics.play_time / 3600
        )} hrs)**`,
        inline: true,
      },
      {
        name: 'Статистика 📊',
        value: `Рейтинговые очки:\n└── **${numberWithSpaces(
          profile.statistics.ranked_score
        )}**\n Аккуратность: **${numberWithSpaces(
          profile.statistics.hit_accuracy.toString().slice(0, 5)
        )}%**\n Количество игр: **${numberWithSpaces(
          profile.statistics.play_count
        )}**`,
        inline: true,
      },
      {
        name: 'Доп. информация 🖇️',
        value: `${
          profile.location ? `📍 **${profile.location}**` : `📍 *Не указано*`
        }\n ${
          profile.interests ? `❤️ **${profile.interests}**` : `❤️ *Не указано*`
        }\n ${
          profile.occupation
            ? `💼 **${profile.occupation}**`
            : `💼 *Не указано*`
        }`,
        inline: true,
      }
    );

  return profileEmbed;
}
