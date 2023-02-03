import {
  AnyThreadChannel,
  Client,
  EmbedBuilder,
  Message,
} from 'discord.js';
import { VoiceConnection, AudioPlayer } from '@discordjs/voice';
import Jsoning from 'jsoning';
import config from '../config';
import * as play from 'play-dl';
import path from 'path';
import * as fs from 'fs';
import { serverStart } from '../webserver/main';
import { osuAccountData } from '../utils/types';

export interface guildObject {
  voiceConnection: VoiceConnection;
  audioPlayer: AudioPlayer;
  queue: Array<string>;
  embed: {
    playerMessage?: Message<true>;
    playerEmbed?: EmbedBuilder;
    playerThread?: AnyThreadChannel<boolean>;
  };
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

  async startWebServer() {
    return await serverStart().catch((err) => {
      console.error(`[Web Server Error]`, err);
      process.exit(1);
    });
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
}
