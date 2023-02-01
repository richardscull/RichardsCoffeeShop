import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import {
  data as playSubcommand,
  execute as playExecute,
} from './play-subcommand';
import {
  data as stopSubcommand,
  execute as stopExecute,
} from './stop-subcommand';

export const data = new SlashCommandBuilder()
  .setName('music')
  .setDescription('Music commands')
  .setDMPermission(false)
  .addSubcommand(playSubcommand)
  .addSubcommand(stopSubcommand);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  if (!interaction.inCachedGuild())
    return await interaction.reply({
      content:
        '> **Что-то пошло не так... **\n> 🚧 Эта комманда должна быть использована на сервере!',
      ephemeral: true,
    });

  const memberVoice = interaction.member.voice?.channel;
  const commandName = interaction.options.getSubcommand();

  if (!memberVoice) {
    return await interaction.reply({
      content:
        '> **Что-то пошло не так... **\n> ❌ Вы должны находиться в голосовом канале, чтобы использовать эту команду!',
      ephemeral: true,
    });
  } else if (commandName !== 'play') {
    if (memberVoice && !memberVoice.members.has(interaction.client.user.id))
      return await interaction.reply({
        content:
          '> **Что-то пошло не так... **\n> 🚧 Плеер еще не запущен, либо вы находитесь не в том же голосовом канале c ботом!',
        ephemeral: true,
      });
  }

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
  play: playExecute,
  stop: stopExecute,
};
