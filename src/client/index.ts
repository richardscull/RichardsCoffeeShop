import { Client, GatewayIntentBits, Partials } from 'discord.js';
import config from '../config';
import registerEvents from '../events';
import { serverStart } from '../webserver/main';

export const client = new Client({
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
registerEvents(client);

//TODO: Try to make these async => look better.
const discordLogin = async () => {
  await client.login(config.DISCORD_TOKEN).catch((err) => {
    console.error(`[Discord Login Error]`, err);
    process.exit(1);
  });
};
discordLogin();

//NOTICE: I currently closed eyes on web server.
//Will continue working with it after I done with main features for bot.
const startWebServer = async () => {
  await serverStart().catch((err) => {
    console.error(`[Web Server Error]`, err);
    process.exit(1);
  });
};
startWebServer();
