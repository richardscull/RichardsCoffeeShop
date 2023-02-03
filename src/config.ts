import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();
const {
  DISCORD_SECRET,
  DISCORD_TOKEN,
  DISCORD_ID,
  OSU_SECRET,
  OSU_ID,
  NGROK_TOKEN,
  SPOTIFY_ID,
  SPOTIFY_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_MARKET,
} = process.env;
let { NGROK_PORT, GITHUB_BRANCH_URL } = process.env;

if (!DISCORD_SECRET || !DISCORD_TOKEN || !DISCORD_ID) {
  throw new Error(chalk.yellowBright('⚠️   Missing arguments in .env file!'));
}

if (!OSU_SECRET || !OSU_ID || !NGROK_TOKEN) {
  throw new Error(
    chalk.yellowBright('⚠️   Missing web/osu! related arguments in .env file!')
  );
}

if (
  !SPOTIFY_ID ||
  !SPOTIFY_SECRET ||
  !SPOTIFY_REFRESH_TOKEN ||
  !SPOTIFY_MARKET
) {
  throw new Error(
    chalk.yellowBright('⚠️   Missing spotify related arguments in .env file!')
  );
}

const defaultGithubBranch =
  'repos/richardscull/RichardsCoffeeShop/commits/master';
const defaultNgrokPort = '3000';
GITHUB_BRANCH_URL = GITHUB_BRANCH_URL ? GITHUB_BRANCH_URL : defaultGithubBranch;
NGROK_PORT = NGROK_PORT ? NGROK_PORT : defaultNgrokPort;

const config: Record<string, string> = {
  DISCORD_ID,
  DISCORD_TOKEN,
  DISCORD_SECRET,
  GITHUB_BRANCH_URL,
  NGROK_PORT,
  NGROK_TOKEN,
  OSU_SECRET,
  OSU_ID,
  SPOTIFY_ID,
  SPOTIFY_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_MARKET,
};

export default config;
