import {
  SlashCommandBuilder,
  bold,
  time,
  inlineCode,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import os from 'os';
import { ExtendedClient } from '../../client/ExtendedClient';
import ngrok from 'ngrok';
import axios from 'axios';
import config from '../../config';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription(`Bot's status`);

const buttonsRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
  //Note: Doesn't sure if I want to implement this feature, disabled for now
  new ButtonBuilder()
    .setCustomId('createTicket')
    .setLabel('📨 Сообщить о ошибке')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true),
  new ButtonBuilder()
    .setURL('https://github.com/richardscull/RichardsCoffeeShop')
    .setLabel('📂 GitHub')
    .setStyle(ButtonStyle.Link)
);

const imgForEmbed = new AttachmentBuilder(
  path.join(__dirname, '..', '..', '..', 'images', 'statusEmbed.png'),
  { name: 'statusEmbed.png' }
);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  const guildsCached = client.guilds.cache.size.toString();
  const usersInGuilds = client.guilds.cache
    .reduce((acc, guild) => acc + guild.memberCount, 0)
    .toString();

  const statusEmbed = new EmbedBuilder()
    .setAuthor({
      name: 'Технический отчет бота',
      iconURL: client.user?.displayAvatarURL(),
    })
    .setColor('NotQuiteBlack')
    .setTitle(`> "_${client.user?.username}_"`)
    .setFields(
      {
        name: bold(`📋 Общая информация`).toString(),
        value:
          `‣ Бот установлен на ${bold(guildsCached)} серверах.\n` +
          `‣ Бот обслуживает ${bold(usersInGuilds)} пользователей.\n` +
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          `‣ Рестарт был: ${time(client.readyAt!, 'R')}.`,
        inline: true,
      },
      {
        name: '🔧 Техническая информация',
        value:
          `‣ Web-сервер: ${
            ngrok.getUrl() ? bold('Работает!') : bold('Выключен!')
          }\n` +
          `‣ Версия бота: Загрузка...\n` +
          `‣ Рестарт сервера был: <t:${
            Math.floor(Date.now() / 1000) - os.uptime()
          }:R>`,
        inline: true,
      }
    )
    .setImage(`attachment://${imgForEmbed.name}`)
    .setFooter({
      text: `⚙️ Использовано памяти: Загрузка...; 🪄 Пинг: Загрузка...`,
    });

  const statusMsg = await interaction.reply({
    embeds: [statusEmbed],
    files: [imgForEmbed],
    components: [buttonsRow],
    fetchReply: true,
  });

  const lastestCommitId = await axios({
    baseURL: 'https://api.github.com/',
    url: config.GITHUB_BRANCH_URL,
  }).then((result) => result.data.sha as string);

  if (statusEmbed && statusEmbed.data && statusEmbed.data.fields) {
    statusEmbed.data.fields[1].value =
      `‣ Web-сервер: ${
        ngrok.getUrl() ? bold('Работает!') : bold('Выключен!')
      }\n` +
      `‣ Версия бота: ${inlineCode(lastestCommitId.slice(0, 7))}\n` +
      `‣ Рестарт сервера был: <t:${
        Math.floor(Date.now() / 1000) - os.uptime()
      }:R>`;
  }

  const totalPing = statusMsg.createdTimestamp - interaction.createdTimestamp;
  const usedMemory =
    (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) + '%';

  statusEmbed.setFooter({
    text: `⚙️ Использовано памяти: ${usedMemory}; 🪄 Пинг: ${totalPing}мс`,
  });
  await interaction.editReply({
    embeds: [statusEmbed],
    files: [imgForEmbed],
    components: [buttonsRow],
  });
}
