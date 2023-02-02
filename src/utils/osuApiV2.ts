import axios from 'axios';
import { client } from '../client';
import config from '../config';
import {
  osuAccountData,
  osuApiCreditals,
  osuRequestAccountData,
} from './types';

export async function getOsuClientToken() {
  return await axios
    .post<osuApiCreditals>(
      'https://osu.ppy.sh/oauth/token',
      {
        client_id: config.OSU_ID,
        client_secret: config.OSU_SECRET,
        grant_type: 'client_credentials',
        scope: 'public',
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    )
    .then((response) => {
      return response.data.access_token;
    });
}

export async function checkUserAcessToken(
  userId: string,
  userData: osuAccountData
) {
  if (!userData) return;

  const eightyNineDaysInMS = 89 * 24 * 60 * 60 * 1000;
  const isAccessTokenUsable = userData.expires_on - Date.now();
  const isRefreshTokenUsable =
    userData.expires_on + eightyNineDaysInMS < Date.now();

  if (isAccessTokenUsable) {
    return userData.access_token;
  }

  if (isRefreshTokenUsable) {
    const { data: refreshUserData } = await axios.post<osuRequestAccountData>(
      'https://osu.ppy.sh/oauth/token',
      {
        client_id: config.OSU_ID,
        client_secret: config.OSU_SECRET,
        refresh_token: userData.refresh_token,
        grant_type: 'refresh_token',
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    await client.database.osuUsers.set(userId, {
      expires_on: Date.now() + refreshUserData.expires_in * 1000,
      access_token: refreshUserData.access_token,
      refresh_token: refreshUserData.refresh_token,
      token_type: refreshUserData.token_type,
    });
    return refreshUserData.access_token;
  } else {
    await client.deleteOsuAccount(userId);
    return null;
  }
}
