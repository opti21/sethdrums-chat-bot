package redis

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/opti21/pepega-chat/pkg/db"
	"github.com/opti21/pepega-chat/pkg/grpc"
	"github.com/opti21/pepega-chat/pkg/utils"
)

var Client *redis.Client

func Init() {
  Client = redis.NewClient(&redis.Options{
    Addr: utils.GetEnv("REDIS_ADDR"),
    Password: utils.GetEnv("REDIS_PASS"),
    DB: 0,
  })
}

func CheckCache (videoId string) {
  cacheResult, cacheErr := Client.Get(context.Background(), videoId).Result()
  switch {
  case cacheErr == redis.Nil:
    // Song not found on cache
  	log.Println("key does not exist")
    log.Println("Video not in cache, getting details from PepoG")
    
    pepogResp, err := grpc.GetVideo(videoId)

    if err != nil {
      log.Println("Err getting video from pepog: ", err)
    }

    cacheVidDetails, _ := json.Marshal(
      &db.CacheVideoDetails{
        Title: pepogResp.Title,
        Channel: pepogResp.Channel,
        Duration: pepogResp.Duration, 
        EmbedBlocked: pepogResp.EmbedBlocked,
        RegionBlocked: pepogResp.RegionBlocked,
      },
    )

    // Add to cache
    cacheAddErr := Client.Set(context.Background(), videoId, cacheVidDetails , time.Hour * 4)

    if cacheAddErr != nil {
      log.Println("Cache add error: ", cacheAddErr)
    }

    video, videoCreateErr := db.CreateRequest(videoId)

    if videoCreateErr != nil {
      log.Println("ERROR CREATING VIDEO: ", videoCreateErr)
    }

    requestAddErr := db.CreateRequestAndUpdateQueue(video.ID, message.User.DisplayName)

    if requestAddErr != nil {
      return
    }

    client.Say(message.Channel, fmt.Sprintf("Beep Boop. @%s requested %s", message.User.DisplayName, pepogResp.Title))
    return

  case cacheErr != nil:
  	log.Println("Redis Cache Get failed ", cacheErr)
    return
  }

  // Video in cache
  fmt.Println("VIDEO IN CACHE: ", cacheResult)
  // TODO: check for region and embed blocks maybe
  
  client.Say(message.Channel, fmt.Sprintf("@%s requested %s", message.User.DisplayName, splitStr[1]))
  return
}
