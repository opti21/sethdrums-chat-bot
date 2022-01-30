package pepegaserver

import (
  "context"

  pb "github.com/opti21/pepegarpc/internal/pepegaproto"
  "github.com/opti21/pepega-ws/pkg/websocket"
)

type Server struct {}

func (s *Server) SendWSUpdate(ctx context.Context, update *pb.Update) (response *pb.WsResponse, err error) {
  return &pb.WsResponse{
    Success: true,
  }, nil
}
