// Package db provides methods for creating items on the database.
package db

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"github.com/opti21/pepega-ws/pkg/utils"
)

const(
  QUEUE_ID = 2
)

var db *sql.DB
var err error

type CacheRequest struct {
  video_id string
}

type CacheVideoDetails struct {
  Id string
  Title string
  Channel string
  Duration int64
  EmbedBlocked bool
  RegionBlocked bool
}

type Video struct {
  ID int64
  VideoId string
  Title string
  Channel string
  RegionBlocked bool
  EmbedBlocked bool
  Duration int64
}

type PGStatus struct {
  VideoId int64
  Status string
  Checker string
  Timestamp int64
}

type Request struct {
  ID int64
  VideoId int64
  RequestedBy string
}

type Queue struct  {
  Order string
  IsUpdating bool
  BeingUpdatedBy string
}

type Session struct {
  Id           string `db:"id"`
  SessionToken string `db:"sessionToken"`
  UserId       string `db:"userId"`
  Expires      string `db:"expires"`
}

type User struct {
  Id string `db:"id"`
  Name string `db:"name"`
  Email string `db:"email"`
  EmailVerified sql.NullString `db:"emailVerified"`
  Image string `db:"image"`
}

type Mod struct {
  Id string `db:"id"`
  Name string `db:"name"`
}


// Init initializes the database connection
func Init() {
  db, err = sql.Open("postgres", utils.GetEnv("POSTGRES_DSN"))

  if err != nil {
    log.Fatal("DB ERROR: ", err)
  }

  fmt.Println("DB Connected")
  
}


func CheckIfMod(sessionToken string) bool {
  fmt.Println(sessionToken)
  session := Session{}
  
  sessionRow := db.QueryRow(`SELECT * FROM "Session" WHERE "sessionToken"=$1`, sessionToken)
  switch err := sessionRow.Scan(&session.Id, &session.SessionToken, &session.UserId, &session.Expires); err {
  case sql.ErrNoRows:
    fmt.Println("No rows were returned!")
    return false
  case nil:
    fmt.Println(session)
  default:
    panic(err)
  }

  user := User{}

  userRow := db.QueryRow(`SELECT * FROM "User" WHERE id=$1`, session.UserId)
  switch err := userRow.Scan(&user.Id, &user.Name, &user.Email, &user.EmailVerified, &user.Image); err {
  case sql.ErrNoRows:
    fmt.Println("No rows were returned!")
    return false
  case nil:
    fmt.Println(user)
  default:
    panic(err)
  }

  mod := Mod{}

  modRow := db.QueryRow(`SELECT * FROM "Mod" WHERE name=$1`, user.Name)
  switch err := modRow.Scan(&mod.Id, &mod.Name); err {
  case sql.ErrNoRows:
    fmt.Println("Not a Mod")
    return false
  case nil:
    fmt.Println(mod)
  default:
    panic(err)
  }

  return true

}
