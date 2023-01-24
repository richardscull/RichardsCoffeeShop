import express from 'express';
import ngrok from 'ngrok';
import cookieParser from 'cookie-parser';
import config from '../config';
import axios from 'axios';
import favicon from 'serve-favicon';
import path from 'path';
import {
  osuCredentialsGrantResponse,
  discordUserResponse,
} from '../utils/types';
import { client } from '../client';

export async function serverStart() {
  const ngrokUrl = await ngrok.connect({
    authtoken: process.env.NGROK_TOKEN,
    addr: '3000',
  });
  console.log('\x1b[34m', `💤 Web server is loaded!`);
  console.log('\x1b[34m', `Currently hosted at \x1b[1m${ngrokUrl}`, '\x1b[0m');

  return await expressJs(ngrokUrl);
}

async function expressJs(ngrokUrl: string) {
  const app = express();
  app
    .use('/', express.static(__dirname))
    .use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
    .use(cookieParser());



  app.get('/login', async (req, res) => {
    const scope = ['identify'];
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${
      process.env.CLIENT_ID
    }&redirect_uri=${ngrokUrl}/callback&response_type=code&scope=${scope.join(
      '%20'
    )}`;

    res.redirect(authUrl);
  });

  app.get('/osu', async (req, res) => {
    const client_secret = process.env.OSU_SECRET;
    const client_id = process.env.OSU_ID;

    if (!req.query.code)
      return res.redirect(
        `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${client_id}/&redirect_uri=${ngrokUrl}&scope=public&state=code`
      );

    const data = await axios.post<osuCredentialsGrantResponse>(
      'https://osu.ppy.sh/oauth/token',
      {
        client_id: client_id,
        client_secret: client_secret,
        code: req.query.code,
        grant_type: 'authorization_code',
        redirect_uri: `${ngrokUrl}`,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    return res.redirect(`${ngrokUrl}/osu?code=${data.data.refresh_token}`);
  });

  app.get('/callback', async (req, res) => {
    const clientId = config.CLIENT_ID;
    const clientSecret = config.CLIENT_SECRET;
    const redirectUri = `${ngrokUrl}/callback`;
    const code = req.query.code;

    try {
      if (code) {
        const { data } = await axios.post(
          'https://discord.com/api/oauth2/token',
          {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: code.toString(),
            redirect_uri: redirectUri,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        res.cookie('discord_token', data.access_token, {
          httpOnly: true,
          secure: true,
        });
        res.redirect('/');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred');
    }
  });

  app.get('/logout', async (req, res) => {
    if (!req.cookies.discord_token) return res.redirect('/login');
    try {
      const token = req.cookies.discord_token;
      const user = await axios.get<discordUserResponse>(
        'https://discord.com/api/v9/users/@me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await client.deleteOsuAccount(user.data.id);

      return res.sendFile(__dirname + '/osuLogout.html');
    } catch (err) {
      console.log(err);
    }
  });

  app.get('/', async (req, res) => {
    try {
      if (!req.cookies.discord_token) return res.redirect('/login');
      const token = req.cookies.discord_token;
      const user = await axios.get<discordUserResponse>(
        'https://discord.com/api/v9/users/@me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const osuAccount = await client.getOsuAccount(user.data.id);
      if (!osuAccount) {
        if (!req.query.code)
          return res.redirect(
            `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${process.env.OSU_ID}&redirect_uri=${ngrokUrl}/&scope=public&state=code`
          );

        await client.database.osuUsers.set(user.data.id, {
          refresh_token: req.query.code,
        });
      }

      return res.sendFile(__dirname + '/osuPage.html');
    } catch (err) {
      console.log(err);
    }
  });

  app.listen(3000);
}
