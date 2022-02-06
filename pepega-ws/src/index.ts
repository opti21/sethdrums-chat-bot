import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { URL } from "url";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

const redis = new Redis({
  password: process.env.REDIS_PASS,
});

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

class Message {
  type?: string;
  order?: string;
  being_updated_by?: string;
  is_updating?: boolean;
  mod_name?: string;
}

wss.on("connection", async (ws) => {
  console.log("endpoint hit");

  const queue = await redis.hgetall("sethdrums:queue");

  console.log(queue);

  const connectMessage = new Message();
  connectMessage.type = "INIT";
  connectMessage.order = queue.order ? queue.order : "";
  connectMessage.is_updating = queue.is_updating === "1"
  ws.send(JSON.stringify(connectMessage));

  ws.on("message", (data) => {
    console.log("received: %s", data);
    const jsonMessage: Message | JSON = JSON.parse(data.toString());
    const incomingMessage: Message = <Message>jsonMessage;

    switch (incomingMessage.type) {
      case "DRAG_START":
        console.log("Drag Started");
        sendQueueLock(incomingMessage.being_updated_by);
        break;

      case "SERVER_START":
        console.log("Server updating queue");
        sendQueueLock("SERVER");
        break;

      case "DRAG_END":
        console.log("Drag Ended");
        sendQueueUnlock(incomingMessage.order)
        break;

      case "SERVER_END":
        console.log("Server done updating queue")
        sendQueueUnlock(incomingMessage.order)
        break;
      case "JOIN":
        console.log("Mod joined");
        wss.clients.forEach((client) => {
          const feMessage = new Message();
          feMessage.type = "MOD_JOINED";
          feMessage.mod_name = incomingMessage.mod_name;
          client.send(JSON.stringify(feMessage));
        });
    }
  });
});

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/modws") {
    // Check for user session on DB
    console.log(request.headers);

    if (request.headers["sec-websocket-protocol"]) {
      if (
        request.headers["sec-websocket-protocol"] === process.env.SERVER_WS_KEY
      ) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    }
    const cookies = request.headers.cookie?.split(" ").map((cookie) => {
      const splitStr = cookie.split("=");
      return {
        name: splitStr[0],
        value: splitStr[1].replace(";", ""),
      };
    });

    cookies?.forEach(async (cookie) => {
      if (cookie.name === "next-auth.session-token") {
        console.log("Has cookie");
        const session = await prisma.session.findUnique({
          where: {
            sessionToken: cookie.value,
          },
        });
        if (session) {
          console.log("Has session, upgrading");
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
          });
          return;
        } else {
          socket.destroy();
          return;
        }
      }
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080);

function sendQueueLock(username: string | undefined) {
  wss.clients.forEach((client) => {
    const feMessage = new Message();
    feMessage.type = "QUEUE_LOCK";
    feMessage.is_updating = true;
    feMessage.being_updated_by = username;
    client.send(JSON.stringify(feMessage));
  });
}

function sendQueueUnlock(newOrder: string | undefined) {
  wss.clients.forEach((client) => {
    const feMessage = new Message();
    feMessage.type = "QUEUE_UNLOCK";
    feMessage.is_updating = false;
    feMessage.being_updated_by = "";
    feMessage.order = newOrder;
    client.send(JSON.stringify(feMessage));
  });
}
