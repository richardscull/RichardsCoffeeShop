import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import {
  data as profileSubcommand,
  execute as profileExecute,
} from './profile-subcommand';

export const data = new SlashCommandBuilder()
  .setName('osu')
  .setDescription('Команды для игры "osu!"')
  .addSubcommand(profileSubcommand);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  const commandName = interaction.options.getSubcommand();
  if (commandName in subcommandFunctions) {
    const subcommandFunction = subcommandFunctions[commandName];
    await subcommandFunction(interaction, client);
  }
}

const subcommandFunctions: Record<
  string,
  (
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) => Promise<void>
> = {
  profile: profileExecute,
};
