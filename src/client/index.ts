import { GatewayIntentBits, Partials } from 'discord.js';
import { ExtendedClient } from './ExtendedClient';
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

async function serverInitializing() {
  await client.discordLogin();
  client.ngrokUrl = await client.startWebServer();
  await client.registerCustomEmojis();
}

serverInitializing();
