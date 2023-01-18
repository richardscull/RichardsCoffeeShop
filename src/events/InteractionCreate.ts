import { Client, Events, ChatInputCommandInteraction } from 'discord.js';
import * as commandModules from '../commands';
const commands = Object(commandModules);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { commandName } = interaction;

    try {
      await commands[commandName].execute(interaction, client);
    } catch (error) {
      console.error(`Error executing [${interaction.commandName}] | `, error);
      if (interaction.replied) {
        return await interaction.followUp({
          content:
            '> **Что-то пошло не так... **\n> ⚠️ Похоже возникла ошибка при исполнении этой команды!',
          ephemeral: true,
        });
      } else {
        return await interaction.reply({
          content:
            '> **Что-то пошло не так... **\n> ⚠️ Похоже возникла ошибка при исполнении этой команды!',
          ephemeral: true,
        });
      }
    }
  },
};
