import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { twitch } from "chatbot";
import Pusher from "pusher";

const app = new Hono();

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const rooms = new Map<string, Set<ServerWebSocket>>();
const topic = "sethdrums-queue";

app.get("/", (c) => c.text("PepegaBot is running!"));

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.subscribe("pepega");
        console.log(
          `WebSocket server opened and subscribed to topic '${topic}'`
        );
        ws.send("Hello from server!");
      },
      onClose: (_, ws) => {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.unsubscribe(topic);
        console.log(
          `WebSocket server closed and unsubscribed from topic '${topic}'`
        );
      },
    };
  })
);

twitch.connect().catch(console.error);

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher environment variables");
}

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  host: process.env.PUSHER_HOST!,
  port: process.env.PUSHER_PORT!,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  useTLS: true,
});

const port = process.env.PORT || 3000;
console.log(`Server is running on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port: port,
  websocket: websocket,
});
