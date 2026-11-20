import { Hono } from "hono";
import { twitch } from "chatbot";
import { checkRealtimeConfig } from "realtime";

const app = new Hono();

app.get("/", (c) => c.text("PepegaBot is running!"));

twitch.connect().catch(console.error);

checkRealtimeConfig();

const port = process.env.PORT || 3000;
console.log(`Server is running on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port: port,
});
