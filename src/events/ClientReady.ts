import { Client, Events } from 'discord.js';

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(
      '\x1b[32m',
      `✅ Ready! Logged in as \x1b[1m${client.user?.tag}`
    );
    client.user?.setPresence({
      activities: [{ name: '🪴 недоразвитый цветок' }],
      status: 'online',
    });
  },
};
