import { REST } from '@discordjs/rest';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Routes } from 'discord-api-types/v9';
import config from '../config';
import * as commandModules from '../commands';

type Command = {
  data: Pick<SlashCommandBuilder, 'toJSON'>;
};

const commands: Pick<SlashCommandBuilder, 'toJSON'>[] = [];

for (const module of Object.values<Command>(commandModules)) {
  commands.push(module.data);
}

const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);

rest
  .put(Routes.applicationCommands(config.CLIENT_ID), { body: commands })
  .then(() => {
    //TODO: Change text and add color!
    console.log('Successfully registered application commands.');
  })
  .catch(console.error);
