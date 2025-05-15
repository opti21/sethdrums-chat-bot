import { Hono } from "hono";
import { twitch } from "chatbot";
import Pusher from "pusher";

const app = new Hono();

app.get("/", (c) => c.text("PepegaBot is running!"));

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
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
});

const port = process.env.PORT || 3000;
console.log(`Server is running on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port: port,
});
