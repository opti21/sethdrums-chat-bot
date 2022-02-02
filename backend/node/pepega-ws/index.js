"use strict";
exports.__esModule = true;
var http_1 = require("http");
var ws_1 = require("ws");
var server = (0, http_1.createServer)();
var wss = new ws_1.WebSocketServer({ noServer: true });
wss.on("connection", function (ws) {
    console.log("endpoint hit");
    ws.on("message", function (data) {
        console.log("received: %s", data);
    });
});
server.on("upgrade", function (request, socket, head) {
    if (request.url === "/modws") {
        wss.handleUpgrade(request, socket, head, function (ws) {
            wss.emit("connection", ws, request);
        });
    }
    else {
        socket.destroy();
    }
});
server.listen(8080);
