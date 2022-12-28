import { Client, GatewayIntentBits, Partials } from "discord.js";
import config from "../config";
import registerEvents from "../events";
import { serverStart } from "../osuserver/main";

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

const startOsuServer = async () => {
  await serverStart().catch((err) => {
    console.error(`[Osu Server Error]`, err);
    process.exit(1);
  });
};
startOsuServer();

client.login(config.DISCORD_TOKEN).catch((err) => {
  console.error(`[Discord Login Error]`, err);
  process.exit(1);
});
