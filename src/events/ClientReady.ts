import { Client, Events } from 'discord.js';

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(
      '\x1b[32m%s\x1b[0m',
      `Ready! Logged in as ${client.user?.tag}.`
    );
    console.log(`Servers: ${client.guilds.cache.size}\n`);
    client.user?.setPresence({
      activities: [{ name: '🪴 недоразвитый цветок' }],
      status: 'online',
    });
  },
};
