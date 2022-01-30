package main

import (
  "net/http"

  "github.com/opti21/pepegarpc/internal/pepegaserver"
  "github.com/opti21/pepegarpc/internal/pepegaproto"
)

func main() {
  server := &pepegaserver.Server{}
  twirpHandler := pepegaproto.NewPepegaServiceServer(server)

  http.ListenAndServe(":1337", twirpHandler)
}
