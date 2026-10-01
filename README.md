# Paradise SMP Website

Static website for Paradise SMP (`paradisesmp.fun`). It reads public live data from the Paradise SMP Discord bot API.

## Deploy (Vercel)
1. Upload this folder to GitHub or Vercel.
2. Open `config.js` and set `window.PARADISE_API_BASE` to the HTTPS public URL of your deployed Discord bot, e.g. `https://your-bot.up.railway.app`.
3. Deploy.

## Bot environment
In the updated bot `.env`, set:

```env
WEBSITE_ORIGIN=https://YOUR-WEBSITE-DOMAIN.vercel.app
```

You can use comma-separated origins if you have more than one website domain.

## Live features
- Online/offline server status
- Current / maximum player slots
- Online player list
- Top money (Vault economy when available)
- Top kills
- Top deaths
- Top playtime
- Recent join/leave/death feed
- Terms of Service
- Privacy Policy

Player leaderboard data begins populating when the updated Minecraft plugin is connected. Existing offline-player stats are synced after bridge authentication.


Economy note: Top Money is the live/synced Minecraft Vault economy. Precise player coordinates are not exposed by the public API.
