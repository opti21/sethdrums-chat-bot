package ws

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"

	"github.com/gorilla/websocket"
	"github.com/opti21/pepega-chat/pkg/utils"
)

var addr = flag.String("addr", "localhost:8080", "http service address")

var Conn *websocket.Conn

func Init() {
	flag.Parse()
	log.SetFlags(0)

  interrupt := make(chan os.Signal, 1)
  signal.Notify(interrupt, os.Interrupt)

	u := url.URL{Scheme: "wss", Host: *addr, Path: "/modws"}
	log.Printf("connecting to %s", u.String())


  Conn, _, err := websocket.DefaultDialer.Dial(
    u.String(), 
    http.Header{
      "Pepega-ws-key": []string{utils.GetEnv("SERVER_WS_KEY")},
  })

	if err != nil {
		log.Fatal("dial:", err)
	}
	defer Conn.Close()

	go func() {
		<-interrupt
    closemessage := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Chat client closing")
    if err := Conn.WriteMessage(websocket.CloseMessage, closemessage); err != nil {
      fmt.Println(err)
    }
    Conn.Close()
		fmt.Println("\r- Ctrl+C pressed in Terminal")
		os.Exit(0)
	}()

  for {
    // receive message
    _, message, err := Conn.ReadMessage()
    if err != nil {
      log.Panic(err)
    }
    log.Printf("Message from websocket: %v\n", string(message))
  }


}

