package grpc

import (
	"context"
	"log"
	"time"

	"github.com/opti21/pepega-chat/pkg/utils"
	pepog_pb "github.com/opti21/pepega-chat/proto/pepog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var pepoGConn *grpc.ClientConn

func Init() {
  // Create connection to PepoG grpc server
  pepoGConn, pepoGErr := grpc.Dial(utils.GetEnv("GRPC_HOST"), grpc.WithTransportCredentials(insecure.NewCredentials()))
  if pepoGErr != nil {
    log.Fatalf("Could not connect to pepoG: %v", pepoGErr)
  }
  defer pepoGConn.Close()
}

func GetVideo(videoId string) (*pepog_pb.VideoDetails, error) {
	// Get vid info from pepoG
  pg_c := pepog_pb.NewVideoDetailsServiceClient(pepoGConn)

	pepogCtx, pepogCancel := context.WithTimeout(context.Background(), time.Second)
	defer pepogCancel()

	pepogResp, pepogErr := pg_c.Lookup(pepogCtx, &pepog_pb.ContentLookup{
		Id:      videoId,
		VideoId: videoId,
		Region:  "US",
	})

	if pepogErr != nil {
		log.Println("pepoG error: ", pepogErr)
		return nil, pepogErr
	}

  return pepogResp, nil
}
