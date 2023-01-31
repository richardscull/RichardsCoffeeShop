import { REST } from '@discordjs/rest';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Routes } from 'discord-api-types/v9';
import config from '../config';
import chalk from 'chalk';
import * as commandModules from '../commands';
import { Collection } from 'discord.js';

type Command = {
  data: Pick<SlashCommandBuilder, 'toJSON'>;
};

const commands: Pick<SlashCommandBuilder, 'toJSON'>[] = [];

for (const module of Object.values<Command>(commandModules)) {
  if (module.data && typeof module.data.toJSON === 'function') {
    commands.push(module.data);
    console.log(module.data);
  }
}

const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);

rest
  .put(Routes.applicationCommands(config.DISCORD_ID), { body: commands })
  .then(() => {
    console.log(
      chalk.green('✅ Successfully registered application commands.')
    );
  })
  .catch(console.error);
