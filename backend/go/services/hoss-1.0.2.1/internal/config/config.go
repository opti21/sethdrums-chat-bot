package config

import (
	"fmt"

	"github.com/caarlos0/env/v6"
)

type Config struct {
	HttpPort string `env:"PORT"`
	Host     string `env:"DB_HOST"`
	Port     string `env:"DB_PORT"`
	User     string `env:"DB_USER"`
	Pass     string `env:"DB_PASS"`
	Base     string `env:"DB_BASE"`
}

func Configure() *Config {
	cfg := Config{}

	if err := env.Parse(&cfg); err != nil {
		fmt.Printf("%+v\n", err)
	}

	return &cfg
}
