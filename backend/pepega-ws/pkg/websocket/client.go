package websocket

import (
	"context"
	"log"

	// "sync"

	"github.com/gorilla/websocket"
	"github.com/opti21/pepega-ws/pkg/redis"
)

var ctxB = context.Background()

type Client struct {
  ID string
  Conn *websocket.Conn
  Pool *Pool
}


func (c *Client) Read() {
  defer func() {
    c.Pool.Unregister <- c
    c.Conn.Close()
  }()

  for {
    var msg Message

    err := c.Conn.ReadJSON(&msg)

    if err != nil {
      log.Printf("Error reading JSON: %s\n", err)
      break
    }

    switch msg.Type {
    case "DRAG_START":
      message := Message{
        Type: "QUEUE_LOCK",
        IsUpdating: true,
        BeingUpdatedBy: msg.BeingUpdatedBy,
      }

      c.Pool.Broadcast <- message
 
      err := redis.RClient.HSet(ctxB, "sethdrums:queue", "order", msg.Order, "is_updating", msg.IsUpdating, "being_updated_by", msg.BeingUpdatedBy).Err()

      if err != nil {
        log.Println("Error setting hash: ", err)
      }


    case "DRAG_END":
      message := Message{
        Type: "QUEUE_UNLOCK",
        IsUpdating: false,
        Order: msg.Order,
      }

      err := redis.RClient.HSet(ctxB, "sethdrums:queue", "order", msg.Order, "is_updating", msg.IsUpdating, "being_updated_by", msg.BeingUpdatedBy).Err()
      if err != nil {
        log.Println("Error setting hash: ", err)
      }

      c.Pool.Broadcast <- message

    case "SERVER_START":
      message := Message{
        Type: "QUEUE_LOCK",
        IsUpdating: true,
        BeingUpdatedBy: "SERVER",
      }

      c.Pool.Broadcast <- message
 
      err := redis.RClient.HSet(ctxB, "sethdrums:queue", "order", msg.Order, "is_updating", msg.IsUpdating, "being_updated_by", "SERVER").Err()

      if err != nil {
        log.Println("Error setting hash: ", err)
      }

    case "SERVER_END":
      message := Message{
        Type: "QUEUE_UNLOCK",
        IsUpdating: false,
        Order: msg.Order,
      }

      err := redis.RClient.HSet(ctxB, "sethdrums:queue", "order", msg.Order, "is_updating", msg.IsUpdating, "being_updated_by", msg.BeingUpdatedBy).Err()
      if err != nil {
        log.Println("Error setting hash: ", err)
      }

      c.Pool.Broadcast <- message

    }

  }
}

func (c *Client) Broadcast(wsMessage *Message) {

  message := Message{
    Type: wsMessage.Type,
  }

  c.Pool.Broadcast <- message
}
