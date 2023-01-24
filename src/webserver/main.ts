import express from 'express';
import ngrok from 'ngrok';
import jwt from 'jsonwebtoken';
//TODO: REWRITE TO MORE CLEANER LOOK
export async function serverStart() {
  const url = await ngrok.connect({
    authtoken: process.env.NGROK_TOKEN,
    addr: '3000',
  });
  console.log('\x1b[34m', `💤 Web server is loaded!`);
  console.log('\x1b[34m', `Currently hosted at \x1b[1m${url}`, '\x1b[0m');
  const app = express();

  app.use('/', express.static(__dirname));
  app.get('/', async (req, res) => {
    if (!req.query.code)
      return res.redirect(
        `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=16003&redirect_uri=${url}&scope=public&state=code`
      );

    const body = {
      client_id: 16003,
      client_secret: 'BmOheAMqAqtgRCJSXBgKoFaJpDV1y5252OmqsWZc',
      code: req.query.code,
      grant_type: 'authorization_code',
      redirect_uri: `${url}`,
    };

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const res2 = await fetch('https://osu.ppy.sh/oauth/token', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res2.json();

    let tokenOsu;
    const refresh_token = data.refresh_token;
    if (refresh_token) {
      tokenOsu = jwt.sign(
        { code: refresh_token },
        '38jJ16!v2SB%B2&lTzlC#zF!Z7OkYvY#4H!6f@5!O2a6zwJvSk',
        {
          expiresIn: 7200000,
        }
      );
    }

    return res.redirect(`${url}/osu?code=${tokenOsu}`);
  });

  app.get('/osu', async (req, res) => {
    if (!req.query.code)
      return res.redirect(
        `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=16003&redirect_uri=${url}&scope=public&state=code`
      );
    //NOT THE FINAL DESIGN OF THE HTML PAGE BTW
    return res.sendFile(__dirname + '/osuPage.html');
  });

  app.listen(3000);
}
