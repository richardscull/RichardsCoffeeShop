import { Client, EmbedBuilder } from 'discord.js';
import Jsoning from 'jsoning';
import config from '../config';
import path from 'path';
import * as fs from 'fs';
import { serverStart } from '../webserver/main';
import { osuAccountData } from '../utils/types';

export class ExtendedClient extends Client {
  ngrokUrl = '';

  database = {
    emojis: new Jsoning('emojis.json'),
    osuUsers: new Jsoning('osuUsers.json'),
  };

  async discordLogin() {
    this.loadEvents();

    return await this.login(config.DISCORD_TOKEN).catch((err) => {
      console.error(`[Discord Login Error]`, err);
      process.exit(1);
    });
  }

  async registerCustomEmojis() {
    if (this.database.emojis.has('isGuildCreated')) return;
    if (this.guilds.cache.size >= 10)
      throw new Error(
        "❌ Unfortunately bot couldn't register custom emotes.\nRefer to the FAQ on github page to fix this issue!"
      );

    const getBotsGuild = await this.guilds.create({
      name: "Emoji's server",
    });

    this.database.emojis.set('isGuildCreated', true);

    const emojis = [
      'ProgressBarStart',
      'ProgressBarPlaying',
      'ProgressBarMedium',
      'ProgressBarWaiting',
      'ProgressBarEnd',
    ];
    for (const emoji of emojis) {
      const createdEmoji = await getBotsGuild.emojis.create({
        attachment: `./images/emojis/${emoji}.png`,
        name: emoji,
      });
      await this.database.emojis.set(emoji, createdEmoji.id);
    }
  }

  loadEvents() {
    const eventsDir = path.join(__dirname, '..', 'events');
    fs.readdir(eventsDir, (err, files) => {
      if (err) throw new Error("Couldn't find the events dir!");
      else {
        files.forEach((file) => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const event = require(eventsDir + '/' + file);
          if (event.once) {
            this.once(event.name, (...args) => event.execute(...args));
          } else {
            this.on(event.name, (...args) => event.execute(...args));
          }
        });
      }
    });
  }

  successEmbed(Title: string) {
    const createEmbed = new EmbedBuilder()
      .setTitle(Title.slice(0, 255))
      .setColor('Green')
      .setTimestamp();
    return createEmbed;
  }

  errorEmbed(Title: string) {
    const createEmbed = new EmbedBuilder()
      .setTitle(Title.slice(0, 255))
      .setColor('Red')
      .setTimestamp();
    return createEmbed;
  }

  async startWebServer() {
    return await serverStart().catch((err) => {
      console.error(`[Web Server Error]`, err);
      process.exit(1);
    });
  }

  async getEmoji(emojiName: string) {
    if (this.database.emojis.has(emojiName)) {
      const emojiId = await this.database.emojis.get(emojiName);
      return `<:${emojiName}:${emojiId}>`;
    }
  }

  async getOsuAccount(discordId: string) {
    return this.database.osuUsers.get(discordId) as osuAccountData;
  }

  async deleteOsuAccount(discordId: string) {
    return this.database.osuUsers.delete(discordId);
  }
}
