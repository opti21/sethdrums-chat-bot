import { createServer } from "http";
import { URL } from "url";
import { WebSocketServer } from "ws";
import { createClient } from "redis"

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
const rClient = createClient({
  password: 
});

(async() => {
  await client.connect
})

wss.on("connection", (ws) => {
  console.log("endpoint hit");
  ws.on("message", (data) => {
    console.log("received: %s", data);
  });
});

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/modws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080);
