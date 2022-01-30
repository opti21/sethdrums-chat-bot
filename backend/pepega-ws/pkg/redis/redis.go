package redis

import (
	"context"

	"github.com/go-redis/redis/v8"
  "github.com/opti21/pepega-ws/pkg/utils"
)

var ctx = context.Background()

var RClient *redis.Client

func Init() {
  RClient = redis.NewClient(&redis.Options{
    Addr: utils.GetEnv("REDIS_ADDR"),
    Password: utils.GetEnv("REDIS_PASS"),
  })
}
