package config

import (
	"lct/internal/model"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	LoggingLevel string
	ServerPort   string
	JwtSecret    string

	PostgresUser     string
	PostgresPassword string
	PostgresHost     string
	PostgresDb       string
}

var Cfg *Config

func NewConfig() error {
	if err := godotenv.Load(); err != nil {
		return err
	}

	Cfg = &Config{
		LoggingLevel:     ParseEnvString("LOGGING_LEVEL"),
		ServerPort:       ParseEnvString("SERVER_PORT"),
		JwtSecret:        ParseEnvString("JWT_SECRET"),
		PostgresUser:     ParseEnvString("POSTGRES_USER"),
		PostgresPassword: ParseEnvString("POSTGRES_PASSWORD"),
		PostgresHost:     ParseEnvString("POSTGRES_HOST"),
		PostgresDb:       ParseEnvString("POSTGRES_DB"),
	}

	return nil
}

func ParseEnvString(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		panic(model.ErrFieldNoValue{Field: key})
	}

	return value
}
