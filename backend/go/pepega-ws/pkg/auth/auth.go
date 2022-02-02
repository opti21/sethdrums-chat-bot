package auth

import (
	"fmt"
	"time"

	jwt "github.com/golang-jwt/jwt"
)

func GenerateJWT() (string, error) {
  token := jwt.New(jwt.SigningMethodHS256)

  claims := token.Claims(jwt.MapClaims)

  claims["authorized"] = true
  claims["user"] = "pepega-chat"
  claims["exp"] = time.Now().Add(time.Minute * 30).Unix()

  tokenString, err := token.SignedString(mySigningKey)

  if err != nil {
    fmt.Errorf("Something went wrong: %s", err.Error())
    return "", err
  }

  return token, nil

}
