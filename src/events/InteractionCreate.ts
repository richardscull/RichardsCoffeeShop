import { Client, Events, ChatInputCommandInteraction } from 'discord.js';
import * as commandModules from '../commands';
const commands = Object(commandModules);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    console.log(interaction);
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { commandName } = interaction;

    try {
      await commands[commandName].execute(interaction, client);
    } catch (error) {
      console.error(`Error executing [${interaction.commandName}] | `, error);
    }
  },
};
