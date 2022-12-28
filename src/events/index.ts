import { Client } from 'discord.js';
import path from 'path';
import * as fs from 'fs';
export * from './ClientReady';

//REWORK THIS LATER :)
export default function registerEvents(client: Client) {
  const eventFiles = fs
    .readdirSync(__dirname)
    .filter((file) => !file.match('index'));
  for (const file of eventFiles) {
    const filePath = path.join(__dirname, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}
