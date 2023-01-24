/* eslint-disable @typescript-eslint/no-unused-vars */
import { GatewayIntentBits, Partials } from 'discord.js';
import config from '../config';
//import registerEvents from '../events';
import { serverStart } from '../webserver/main';
import { ExtendedClient } from './ExtendedClient';

//registerEvents(client);

export const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const startWebServer = async () => {
  await serverStart().catch((err) => {
    console.error(`[Web Server Error]`, err);
    process.exit(1);
  });
};

startWebServer();
client.loadEvents();

client.discordLogin();
