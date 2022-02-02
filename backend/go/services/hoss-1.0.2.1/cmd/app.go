package main

import (
	"fmt"
	"net"

	"github.com/bouffdaddy/hoss/internal/config"
	p "github.com/bouffdaddy/hoss/internal/proto"
	"github.com/bouffdaddy/hoss/internal/service"
	"github.com/bouffdaddy/hoss/internal/storage"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

func main() {
	if err := godotenv.Load(); err != nil {
		panic("unable to read .env file")
	}

	cfg := config.Configure()
	logger := log.WithFields(log.Fields{})
	logger.Println("hoss.internal")

	l, err := net.Listen(
		"tcp",
		fmt.Sprintf(":%s", cfg.HttpPort),
	)
	if err != nil {
		log.Errorf("failed to listen - %s", err)

		return
	}

	dbConnection, err := storage.NewMySQLConnection(cfg)
	if err != nil {
		log.Errorf("failed to connect to MySQL database - %s", err)
	}

	gS := grpc.NewServer()
	lS := service.NewBannedTracksService(logger, dbConnection)

	p.RegisterBannedTracksServiceServer(gS, lS)

	logger.Infof("grpc serving at :%s", cfg.HttpPort)
	if err := gS.Serve(l); err != nil {
		logger.Errorf("grpc faled to serve - %s", err)

		return
	}

}
