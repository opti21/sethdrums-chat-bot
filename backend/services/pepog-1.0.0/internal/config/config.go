package config

import (
	"fmt"

	"github.com/caarlos0/env/v6"
)

type config struct {
	Port         string `env:"PORT"`
	GoogleAPIKey string `env:"GOOGLE_API_KEY"`
}

func Configure() *config {
	cfg := config{}

	if err := env.Parse(&cfg); err != nil {
		fmt.Printf("%+v\n", err)
	}

	return &cfg
}
