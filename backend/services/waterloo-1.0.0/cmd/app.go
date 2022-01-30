package main

import (
	"fmt"
	"net"

	"github.com/bouffdaddy/waterloo/internal/config"
	p "github.com/bouffdaddy/waterloo/internal/proto"
	"github.com/bouffdaddy/waterloo/internal/service"
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
		logger.Errorf("failed to listen - %s", err)

		return
	}

	gS := grpc.NewServer()
	lS := service.NewCacheService(logger, cfg.RedisHost, cfg.RedisPort, cfg.RedisPass, cfg.RedisTTL)

	p.RegisterPublicQueueCacheServiceServer(gS, lS)

	logger.Infof("grpc Serving at :%s", cfg.Port)
	if err := gS.Serve(l); err != nil {
		logger.Errorf("failed to serve - %w", err)

		return
	}

}
