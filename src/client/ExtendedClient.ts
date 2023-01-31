/* eslint-disable @typescript-eslint/no-unused-vars */
import { Client, EmbedBuilder } from 'discord.js';
import { VoiceConnection, AudioPlayer } from '@discordjs/voice';
import Jsoning from 'jsoning';
import config from '../config';
//import registerEvents from '../events';;
import path from 'path';
import * as fs from 'fs';
import { serverStart } from '../webserver/main';

interface guildObject {
  connection: VoiceConnection;
  player: AudioPlayer;
  embed: EmbedBuilder;
  status: {
    isPaused: boolean;
    onRepeat: boolean;
  };
}

export class ExtendedClient extends Client {
  musicPlayer = new Map<string, guildObject>();

  ngrokUrl = '';

  database = {
    guilds: new Jsoning('guilds.json'),
    osuUsers: new Jsoning('osuUsers.json'),
  };

  async discordLogin() {
    this.loadEvents();
    return await this.login(config.DISCORD_TOKEN).catch((err) => {
      console.error(`[Discord Login Error]`, err);
      process.exit(1);
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

  async startWebServer() {
    return await serverStart().catch((err) => {
      console.error(`[Web Server Error]`, err);
      process.exit(1);
    });
  }

  async getOsuAccount(discordId: string) {
    return this.database.osuUsers.get(discordId);
  }

  async deleteOsuAccount(discordId: string) {
    return this.database.osuUsers.delete(discordId);
  }

  async getGuildPlayer(guildID: string) {
    if (this.musicPlayer.has(guildID)) return this.musicPlayer.get(guildID);
  }
}

console.log