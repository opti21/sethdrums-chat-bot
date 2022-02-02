package main

import (
	"fmt"
	"net"

	"github.com/bouffdaddy/pepog/internal/config"
	"github.com/bouffdaddy/pepog/internal/proto"
	"github.com/bouffdaddy/pepog/internal/service"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		panic("unable to read .env")
	}

	cfg := config.Configure()

	logger := log.WithFields(log.Fields{})
	logger.Println("pepog.internal")

	l, err := net.Listen(
		"tcp",
		fmt.Sprintf(":%s", cfg.Port),
	)
	if err != nil {
		logger.Errorf("failed to listen - %w", err)

		return
	}

	gS := grpc.NewServer()
	lS := service.NewYoutubeService(logger, cfg.GoogleAPIKey)

	proto.RegisterVideoDetailsServiceServer(gS, lS)

	logger.Infof("grpc Serving at :%s", cfg.Port)
	if err := gS.Serve(l); err != nil {
		logger.Errorf("failed to serve - %w", err)

		return
	}

}
