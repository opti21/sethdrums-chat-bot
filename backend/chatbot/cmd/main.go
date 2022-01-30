package main

import (
	"fmt"
	"log"
	"strings"
	// "time"

	"github.com/gempir/go-twitch-irc/v3"
	"github.com/opti21/pepega-chat/pkg/db"
	// "github.com/opti21/pepega-chat/pkg/redis"
	"github.com/opti21/pepega-chat/pkg/grpc"
  "github.com/opti21/pepega-chat/pkg/utils"
  "github.com/opti21/pepega-chat/pkg/websocket"
)

func main() {
  utils.Init()
  db.Init()
  grpc.Init()
  ws.Init()

  // Create twitch client
  twitchPass := utils.GetEnv("TWITCH_PASS")
  client := twitch.NewClient("pepega_bot21", twitchPass)

  // Print when connected
  client.OnConnect(func() {
    fmt.Println("Connected to twitch")
  })

  // listen for chat messages
  client.OnPrivateMessage(func(message twitch.PrivateMessage) {
    splitStr := strings.Split(message.Message, " ")
    command := splitStr[0]

    switch command {
    // handle !sr command
    case "!sr":
      // TODO: check if user already has a request in queue

      // check if second agrument isn't blank
      if splitStr[1] == "" {
        client.Say(message.Channel, fmt.Sprintf("@%s you can request a song like !sr youtubelink", message.User.DisplayName))
        return
      }

      // Check if it is a valid youtube link
      isYoutubeURL, ytErr := utils.CheckIsYoutube(splitStr[1])
      if ytErr != nil {
        log.Println("Error checking youtube link: ", ytErr)
      }

      if !isYoutubeURL {
        // Send message to user that link isn't valid youtube link
        client.Say(message.Channel, fmt.Sprintf("Uh oh! @%s I only accept youtube links", message.User.DisplayName))
        log.Println("not a youtube link")
        return
      } 

      videoId := utils.ParseVideoId(splitStr[1])
      // TODO: check if on queue already

      // Create Request
      db.CreateRequest(videoId, message.User.DisplayName)


      // Video in cache
      
      client.Say(message.Channel, fmt.Sprintf("@%s requested %s", message.User.DisplayName, splitStr[1]))
      return

    // Handle hello command
    case "!hello":
      client.Say(message.Channel, fmt.Sprintf("Hey there @%s!", message.User.DisplayName))
      return

    }

  })

  // Join channel
  client.Join("opti_21")

  err := client.Connect()
  if err != nil {
    panic(err)
  }
}



