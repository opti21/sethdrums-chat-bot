package utils

import (
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var Zap *zap.SugaredLogger

func Init() {
  logger, _ := zap.NewProduction()
  defer logger.Sync()
  Zap = logger.Sugar()
}

// get env vars from .env file
func GetEnv(key string) string {
  viper.SetConfigFile("./.env")

  err:= viper.ReadInConfig()

  if err != nil {
    Zap.Fatalf("Error reading .env %s", err)
  }

  value, ok := viper.Get(key).(string)

  if !ok {
    Zap.Fatalf("Invalid type assertion")
  }

  return value

}
