 <h1 align="center">Richard's Coffee Shop</h1>
<h1 align="center">
  <a href="https://www.pixiv.net/en/artworks/69208923"><img src="https://i.imgur.com/QuybZXU.png" alt="Richard's coffee shop"></a>
  
</h1>
<h4 align="center">☕ An open-source, self-hosted Discord bot designed for the game "osu!" with additional features.<h4>

# 📋 Public Testing
If you want to try the bot before self-hosting him, you can add already hosted version of the bot, by clicking here!
> ⚠️ Currently unavailable

# 🔧 Requirements
To set up the self-hosted version of the bot, the following are required:
1. Node.js v16.9.0 or higher
2. Discord.js v14

# ⚙️ Setup
Before we can start the bot, we will need:
- A Discord application. If you don't know how to do it, check [this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html)!
- An Ngrok account for free URL hosting
- An osu! account to create an app for sending osu!API v2 requests

After obtaining these, fill in the .env file with the required information: 

```env
# Bot information
DISCORD_SECRET= Discord application secret
DISCORD_TOKEN= Discord application token
DISCORD_ID= Discord application ID

# Osu information
OSU_SECRET= Osu client secret
OSU_ID= Osu client id

# Web server
NGROK_TOKEN= Ngrok authtoken
NGROK_PORT= Ngrok port #By default is 3000

# Yours GitHub working branch
GITHUB_BRANCH= #By default is /master
```

After that, you can successfully run bot by typing ```npm run build``` or ```yarn build```!
###### Warning: Don't forget to configure callbacks after starting the bot. Refer to the section below for instructions.

# 🖥️ Web server
To set up the web server for user login, you will need to set up callbacks.
> Note: The use of Ngrok to expose a local development server may cause the need to change URLs if the bot is restarted.

For Discord Application, you will need to go on [Developer portal](https://discord.com/developers/applications) to your application, open OAuth2 and add Redirect to ```https://YOUR-NGROK-URL.ngrok.io/callback```

![Discord redirect](https://i.imgur.com/CRX0nQd.png)

To change the osu! client URL, go to [your client](https://osu.ppy.sh/home/account/edit), and change yours Application Callback URL to ```https://YOUR-NGROK-URL.ngrok.io/```

![Discord redirect](https://i.imgur.com/pw4YR2Y.png)




