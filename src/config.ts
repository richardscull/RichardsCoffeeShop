import dotenv from 'dotenv';
dotenv.config();
const { CLIENT_ID, DISCORD_TOKEN, CLIENT_SECRET, GITHUB_TOKEN } = process.env;

let { GITHUB_BRANCH_URL } = process.env;

// These parameters needed to run bot smoothly, so don't forget to fill them!
if (!CLIENT_ID || !DISCORD_TOKEN || !CLIENT_SECRET || !GITHUB_TOKEN) {
  throw new Error('⚠️ Missing arguments in .env file!');
}

const defaultGithubBranch = 'repos/richardscull/TS_DiscordBot/commits/master';
GITHUB_BRANCH_URL = GITHUB_BRANCH_URL ? GITHUB_BRANCH_URL : defaultGithubBranch;

const config: Record<string, string> = {
  CLIENT_ID,
  DISCORD_TOKEN,
  CLIENT_SECRET,
  GITHUB_TOKEN,
  GITHUB_BRANCH_URL,
};

export default config;
