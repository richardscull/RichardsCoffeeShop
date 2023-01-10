import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import os from 'os';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription(`Bot's status`);

export async function execute(interaction: ChatInputCommandInteraction) {
  //TODO WILL POBABLY CHANGE EMBED DESCRIPTION AND IMAGE
  const statusEmbed = new EmbedBuilder()
    .setAuthor({
      name: 'Технический отчет бота',
      iconURL: interaction.client.user.displayAvatarURL(),
    })
    .setColor('#9c5b3a')
    .setTitle('> "_Кофейня Ричарда_"')
    .setDescription(
      `🌿 Бот установлен на **${
        interaction.client.guilds.cache.size
      }** серверах и обслуживает **${interaction.client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      )}** пользователей!\n🍃 Последний рестарт был: **${interaction.client.readyAt.toDateString()}**\n🍵 Бот уже работает: **${Math.floor(
        interaction.client.uptime / (24 * 60 * 60 * 1000)
      )}** дней!\n\n🌱 **Последние обновления:**`
    )
    //TODO: Make all images locally in src dir.
    .setImage(
      'https://media.discordapp.net/attachments/543779600497508352/986701559415050280/cover.png'
    )
    .setFooter({
      text: `⚙️ Использовано памяти: ${
        (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) +
        '%'
      }; 🪄 Пинг: Загрузка...`,
    });

  const statusMsg = await interaction.reply({
    embeds: [statusEmbed],
    fetchReply: true,
  });
  statusEmbed.setFooter({
    text: `⚙️ Использовано памяти: ${
      (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) + '%'
    }; 🪄 Пинг: ${statusMsg.createdTimestamp - interaction.createdTimestamp}мс`,
  });
  interaction.editReply({ embeds: [statusEmbed] });
}
