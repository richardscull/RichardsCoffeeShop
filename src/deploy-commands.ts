import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from "@discordjs/builders";

import { Routes } from "discord-api-types/v9";
import config from "./config";

import * as commandModules from "./commands";

//TODO: Change any type for something more specific.
type Command = {
  data: Pick<SlashCommandBuilder, "toJSON">;
};

const commands = [];

for (const module of Object.values<Command>(commandModules)) {
  commands.push(module.data);
}

const rest = new REST({ version: "9" }).setToken(config.DISCORD_TOKEN);

rest
  .put(Routes.applicationCommands(config.CLIENT_ID), { body: commands })
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch(console.error);
