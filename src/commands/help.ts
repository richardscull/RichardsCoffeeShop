import { SlashCommandBuilder } from '@discordjs/builders';
import {

  ChatInputCommandInteraction,
  Client,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('create a help ticket')
  .addStringOption((option) =>
    option
      .setName('desc')
      .setDescription('Describe your problem')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  if (!interaction?.channelId) return;

  const channel = await client.channels.fetch(interaction.channelId);
  if (!channel || !channel.isTextBased) return;

  /*   const authData = await pb
    .collection("users")
    .authWithPassword(
      process.env.POCKETBASE_USERNAME!,
      process.env.POCKETBASE_PASSWORD!
    );
 */
  const thread = await (channel as TextChannel).threads.create({
    name: `support-${Date.now()}`,
    reason: `Support ticket ${Date.now()}`,
  });

  const problemDescription = interaction.options?.getString('desc') ;

  const { user } = interaction;
  thread.send(`**User:** ${user} \n**Problem:** ${problemDescription}`);

  //console.log(pb.lang);
  return interaction.reply({ content: 'Help is on the way!', ephemeral: true });
}
