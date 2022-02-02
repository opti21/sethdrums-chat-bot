package utils

import (
	"fmt"
	"log"
	"regexp"

	"github.com/spf13/viper"
)


func Init () {
  viper.SetConfigFile("./.env")
  err:= viper.ReadInConfig()

  if err != nil {
    log.Fatalf("Error reading .env %s", err)
  }
  log.Println("Env file loaded")
}


func GetEnv(key string) string {

  value, ok := viper.Get(key).(string)

  if !ok {
    log.Fatalf("Invalid type assertion")
  }

  return value

}

// Checks if url is a valid youtube URL
func CheckIsYoutube(url string) (bool, error) {
  isYoutube, err := regexp.MatchString(`((?:http://)?)(?:www\.)?(?:(youtube\.com/(\/watch\?(?:\=.*v=((\w|-){11}))|.+))|(youtu.be\/\w{11}))`, url)
  if err != nil {
    return false, err
  }
  fmt.Println("is youtube link? ",  isYoutube)

  return isYoutube, nil

}

// Parses ID from youtube url
func ParseVideoId(url string) string {
 // Parse video ID from url
 // Borrowed from https://github.com/MikhailKutsov/YoutubeLinksParser/blob/master/parsed.go

 //linkRegExp, _ := regexp.Compile(`(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+`)
 videoIdRegExp2, _ := regexp.Compile(`^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*`)

 //parserLink := linkRegExp.FindStringSubmatch(splitStr[1])
 parserId := videoIdRegExp2.FindStringSubmatch(url)

 return parserId[2]

}
