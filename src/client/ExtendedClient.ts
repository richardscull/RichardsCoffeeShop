/* eslint-disable @typescript-eslint/no-unused-vars */
import { Client, EmbedBuilder } from 'discord.js';
import { VoiceConnection, AudioPlayer } from '@discordjs/voice';
import Jsoning from 'jsoning';
import config from '../config';
//import registerEvents from '../events';;
import path from 'path';
import * as fs from 'fs';

interface guildObject {
  connection: VoiceConnection;
  player: AudioPlayer;
  embed: EmbedBuilder;
  status: {
    isPaused: boolean;
    onRepeat: boolean;
  };
}

//TODO: Change class name
export class ExtendedClient extends Client {
  //TODO: Add types for Map
  musicPlayer = new Map<string, guildObject>();

  //NOTICE: Currently no use for it, but I will probably do something with it someday
  database = {
    guilds: new Jsoning('guilds.json'),
    osuUsers: new Jsoning('osuUsers.json'),
  };

  async discordLogin() {
    return await this.login(config.DISCORD_TOKEN).catch((err) => {
      console.error(`[Discord Login Error]`, err);
      process.exit(1);
    });
  }

  loadEvents() {
    const eventsDir = path.join(__dirname, '..', 'events');
    console.log(eventsDir);
    fs.readdir(eventsDir, (err, files) => {
      if (err) console.log(err);
      else
        files.forEach((file) => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const event = require(eventsDir + '/' + file);
          if (event.once) {
            this.once(event.name, (...args) => event.execute(...args));
          } else {
            this.on(event.name, (...args) => event.execute(...args));
          }
          console.log('Event Loaded: ' + file.split('.')[0]);
        });
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
