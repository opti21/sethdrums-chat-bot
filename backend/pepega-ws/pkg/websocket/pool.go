package websocket

import (
	"context"
	"fmt"
	"log"

	"github.com/opti21/pepega-ws/pkg/redis"
)

type Pool struct {
  Register chan *Client
  Unregister chan *Client
  Clients  map[*Client]bool
  Broadcast  chan Message
}

type Message struct {
  Type string `json:"type"`
  IsUpdating bool `json:"is_updating"`
  BeingUpdatedBy string `json:"being_updated_by"`
  Order string `json:"order"`
}

func NewPool() *Pool {
  return &Pool{
    Register: make(chan *Client),
    Unregister: make(chan *Client),
    Clients: make(map[*Client]bool),
    Broadcast: make(chan Message),
  }
}

func (pool *Pool) Start() {
  for {
    select {
    case client := <-pool.Register:
      pool.Clients[client] = true
      fmt.Println("Size of Connection Pool: ", len(pool.Clients))

      val, err := redis.RClient.HGet(context.Background(), "sethdrums:queue", "order").Result()
      if err != nil {
        log.Printf("Error getting queue order: %s\n", err)
      }

      client.Conn.WriteJSON(Message{Type: "INIT", Order: val})

      for client, _ := range pool.Clients {
        fmt.Println(client)
        client.Conn.WriteJSON(Message{Type: "MOD_JOINED"})
      }
      break
    case client := <-pool.Unregister:
      delete(pool.Clients, client)
      fmt.Println("Size of Connection Pool:", len(pool.Clients))
      for client, _ := range pool.Clients {
        client.Conn.WriteJSON(Message{Type: "MOD_DISCONNECTED"})
      }
      break
    case message := <-pool.Broadcast:
      fmt.Println("Sending message to all clients in Pool")
      for client, _ := range pool.Clients {
        if err := client.Conn.WriteJSON(message); err != nil {
          fmt.Println(err)
          return
        }
      }
    }
  }
}
