import { Client, EmbedBuilder } from 'discord.js';
import Jsoning from 'jsoning';
import config from '../config';
import * as play from 'play-dl';
import path from 'path';
import * as fs from 'fs';
import { serverStart } from '../webserver/main';
import { guildObject, osuAccountData } from '../utils/types';

export class ExtendedClient extends Client {
  musicPlayer = new Map<string, guildObject>();

  ngrokUrl = '';

  database = {
    guilds: new Jsoning('guilds.json'),
    osuUsers: new Jsoning('osuUsers.json'),
  };

  async discordLogin() {
    this.loadEvents();
    this.loginToSpotify();
    return await this.login(config.DISCORD_TOKEN).catch((err) => {
      console.error(`[Discord Login Error]`, err);
      process.exit(1);
    });
  }

  async loginToSpotify() {
    await play.setToken({
      spotify: {
        client_id: config.SPOTIFY_ID,
        client_secret: config.SPOTIFY_SECRET,
        refresh_token: config.SPOTIFY_REFRESH_TOKEN,
        market: config.SPOTIFY_MARKET,
      },
    });
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
    })
  }

  async getOsuAccount(discordId: string) {
    return this.database.osuUsers.get(discordId) as osuAccountData;
  }

  async deleteOsuAccount(discordId: string) {
    return this.database.osuUsers.delete(discordId);
  }

  async getGuildPlayer(guildID: string) {
    if (this.musicPlayer.has(guildID)) return this.musicPlayer.get(guildID);
  }

  async deleteGuildPlayer(guildID: string) {
    if (this.musicPlayer.has(guildID)) return this.musicPlayer.delete(guildID);
  }
}
