// Package db provides methods for creating items on the database.
package db

import (
	"fmt"
	"log"

	"github.com/opti21/pepega-chat/pkg/utils"
	"github.com/opti21/pepega-chat/pkg/grpc"
	// ws "github.com/opti21/pepega-chat/pkg/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const(
  QUEUE_ID = 2
)

var db *gorm.DB
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

// Init initializes the database connection
func Init() {
  db, err = gorm.Open(postgres.Open(utils.GetEnv("POSTGRES_DSN")), &gorm.Config{})

  if err != nil {
    log.Fatal("DB ERROR: ", err)
  }

  fmt.Println("DB Connected")
  
}

// CreateRequest creates a Request on the Database.
// It returns any errors that encountered.
func CreateRequest(videoId string, username string) error {
  // Create Video on DB first
  video, err := CreateVideo(videoId)

  if err != nil {
    log.Println("Error creating video: ", err)
  }

  // create request on DB
  request := Request{
    VideoId: video.ID,
    RequestedBy: username,
  }
   
  requestResult := db.Table("Request").Create(&request)
  
  if requestResult.Error != nil {
    log.Println("Request DB Add Error: ", requestResult.Error)
    return requestResult.Error
  }
  
  fmt.Println("REQUEST STATUS CREATE DB RESULT: ", requestResult.RowsAffected)

  //TODO: add song to request using websocket

  // lock queue to add song
  lockedQueue := Queue{
    IsUpdating: true,
    BeingUpdatedBy: "SERVER",
  }
  lockResult := db.Table("Queue").Where("id = ?", QUEUE_ID).Updates(lockedQueue)
  fmt.Println("QUEUE LOCK RESULT: ", lockResult.RowsAffected)

  if lockResult.Error != nil {
    log.Println("Error locking queue on DB: ", lockResult.Error)
    return lockResult.Error
  }

  // get current queue
  queue := Queue{}
  db.Table("Queue").Where("id = ?", QUEUE_ID).First(&queue)

  if len(queue.Order) == 0 {
    queue.Order = queue.Order + fmt.Sprint(request.ID)
  } else {
    queue.Order = queue.Order + "," + fmt.Sprint(request.ID)
  }

  queue.BeingUpdatedBy = ""
  queue.IsUpdating = false
  fmt.Println(&queue)

  // unlock and update queue on DB
  updateQueueRes := db.Table("Queue").Where("id = ?", QUEUE_ID).Save(&queue)
  
  fmt.Println("UPDATE QUEUE RESULT: ", updateQueueRes.RowsAffected)

  if updateQueueRes.Error != nil {
    log.Println("Request DB Add Error: ", updateQueueRes.Error)
    return updateQueueRes.Error
  }

  return nil
}

// Creates Video and PGStatus on database
func CreateVideo(videoId string) (video Video, error error) {
  pepogResp, err := grpc.GetVideo(videoId)

  if err != nil {
    log.Fatal("Error getting video info from pepog")
  }

  // Add video to DB
  newVideo := Video{
    VideoId: videoId,
    Title: pepogResp.Title,
    Channel: pepogResp.Channel,
    RegionBlocked: pepogResp.RegionBlocked,
    EmbedBlocked: pepogResp.EmbedBlocked,
    Duration: pepogResp.Duration,
  }

  videoResult := db.Table("Video").Create(&newVideo)

  if videoResult.Error != nil {
    log.Println("DB Add Error: ", videoResult.Error)
    return video, videoResult.Error
  }

  fmt.Println("VIDEO CREATE DB RESULT: ", videoResult.RowsAffected)

  // create pg status on DB
  pgStatus := PGStatus{
    VideoId: newVideo.ID,
    Status: "NOT_CHECKED",
  }
   
  pgResult := db.Table("PG_Status").Create(&pgStatus)

  if pgResult.Error != nil {
    log.Println("PG DB Add Error: ", pgResult.Error)
    return video, pgResult.Error
  }

  fmt.Println("PG STATUS CREATE DB RESULT: ", pgResult.RowsAffected)

  return newVideo, nil
}


