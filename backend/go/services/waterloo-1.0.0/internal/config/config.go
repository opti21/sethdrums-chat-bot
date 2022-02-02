package config

import (
	"fmt"

	"github.com/caarlos0/env/v6"
)

type config struct {
	Port      string `env:"PORT"`
	RedisHost string `env:"REDIS_HOST"`
	RedisPort string `env:"REDIS_PORT"`
	RedisPass string `env:"REDIS_PASS"`
	RedisTTL  int    `env:"REDIS_TTL"`
}

func Configure() *config {
	cfg := config{}

	if err := env.Parse(&cfg); err != nil {
		fmt.Printf("%+v\n", err)
	}

	return &cfg
}
