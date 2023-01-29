import chalk from 'chalk';
import { Client, Events } from 'discord.js';

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(
      chalk.green(`✅ Ready! Logged in as `) +
        chalk.green.bold(client.user?.tag)
    );
    client.user?.setPresence({
      activities: [{ name: '🪴 недоразвитый цветок' }],
      status: 'online',
    });
  },
};
