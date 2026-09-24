// Jarvis Relay Server
// -----------------------------------------------------------------------
// A tiny always-on WebSocket server that lets your devices (Windows app,
// and later a mobile app) find and talk to each other from anywhere,
// even on different networks. It does NOT understand your commands or
// call any AI — it just forwards messages between devices that share the
// same secret "pair code", like a walkie-talkie channel.
//
// Deploy this somewhere free & always-on (Render.com free web service is
// the easiest — see README.md in this folder for step-by-step instructions).
// -----------------------------------------------------------------------

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

// pairCode -> Set of { ws, deviceType, deviceId }
const rooms = new Map();

function getRoom(pairCode) {
  if (!rooms.has(pairCode)) rooms.set(pairCode, new Set());
  return rooms.get(pairCode);
}

function broadcastPresence(pairCode) {
  const room = getRoom(pairCode);
  const devices = [...room].map(c => ({ deviceType: c.deviceType, deviceId: c.deviceId }));
  const payload = JSON.stringify({ type: 'presence', devices });
  for (const client of room) {
    if (client.ws.readyState === client.ws.OPEN) client.ws.send(payload);
  }
}

const server = http.createServer((req, res) => {
  // Simple health check endpoint so hosting platforms know the service is alive.
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Jarvis relay server is running.\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pairCode = (url.searchParams.get('pairCode') || '').trim();
  const deviceType = url.searchParams.get('deviceType') || 'unknown'; // "windows" | "mobile"
  const deviceId = url.searchParams.get('deviceId') || Math.random().toString(36).slice(2, 8);

  if (!pairCode) {
    ws.close(4000, 'pairCode is required');
    return;
  }

  const client = { ws, deviceType, deviceId, pairCode };
  const room = getRoom(pairCode);
  room.add(client);
  console.log(`[connect] ${deviceType}/${deviceId} joined room "${pairCode}" (${room.size} device(s) online)`);
  broadcastPresence(pairCode);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      return; // ignore malformed messages
    }

    // Attach sender info so the receiver knows who it came from.
    msg._from = { deviceType, deviceId };

    const out = JSON.stringify(msg);
    for (const other of room) {
      // Forward to every OTHER device in the same pair (not back to sender).
      if (other !== client && other.ws.readyState === other.ws.OPEN) {
        other.ws.send(out);
      }
    }
  });

  ws.on('close', () => {
    room.delete(client);
    console.log(`[disconnect] ${deviceType}/${deviceId} left room "${pairCode}"`);
    if (room.size === 0) {
      rooms.delete(pairCode);
    } else {
      broadcastPresence(pairCode);
    }
  });

  ws.on('error', () => {
    room.delete(client);
  });

  // Keepalive ping so free hosting platforms don't drop idle connections.
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) ws.ping();
    else clearInterval(pingInterval);
  }, 30000);
});

server.listen(PORT, () => {
  console.log(`Jarvis relay server listening on port ${PORT}`);
});
