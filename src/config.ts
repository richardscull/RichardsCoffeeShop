import dotenv from 'dotenv';
dotenv.config();
const { CLIENT_ID, DISCORD_TOKEN, CLIENT_SECRET } = process.env;

if (!CLIENT_ID || !DISCORD_TOKEN || !CLIENT_SECRET) {
  throw new Error('⚠️ Missing arguments in .env file!');
}

const config: Record<string, string> = {
  CLIENT_ID,
  DISCORD_TOKEN,
  CLIENT_SECRET,
};

export default config;
