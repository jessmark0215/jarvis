# Jarvis Relay Server

This is the piece that lets your devices reach each other **from anywhere**
(not just the same WiFi). It's intentionally dumb: it just forwards
messages between devices that use the same **pair code**. All the "AI
brain" and command execution happens on the Windows app, not here.

You need to deploy this once, somewhere that stays online 24/7. The
easiest free option is **Render.com**.

## Deploy to Render (free)

1. Create a free account at https://render.com (you can sign up with GitHub).
2. Put this `relay-server` folder in its own GitHub repo (or a folder in a
   repo) — Render deploys from GitHub.
   - Easiest path: create a new repo on GitHub, upload these 3 files
     (`package.json`, `server.js`, `README.md`) to it.
3. In Render, click **New +** → **Web Service** → connect that GitHub repo.
4. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance type**: Free
5. Click **Create Web Service**. Render will build and deploy it, and give
   you a public URL like:
   `https://jarvis-relay-yourname.onrender.com`
6. Your WebSocket URL (what the Windows app needs) is the same address
   with `https://` swapped for `wss://`, e.g.:
   `wss://jarvis-relay-yourname.onrender.com`

That's it — this server is now running "in the cloud" and reachable from
your phone's mobile data and your laptop's WiFi alike.

> **Note on the free tier:** Render's free web services go to sleep after
> ~15 minutes of no traffic, and take a few seconds to wake back up on the
> next connection. That's fine for a personal project — your Windows app
> will just auto-reconnect. If you want zero delay later, you can upgrade
> to a paid instance, or use another always-on host (Railway, Fly.io, or
> a cheap VPS all work the same way — this code doesn't change).

## Testing it's alive

Visit your Render URL in a browser (the `https://` one, not `wss://`).
You should see: `Jarvis relay server is running.`
