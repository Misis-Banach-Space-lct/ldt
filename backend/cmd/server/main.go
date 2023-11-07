package main

import (
	"fmt"
	"lct/internal/api/router"
	"lct/internal/config"
	"lct/internal/database"
	"lct/internal/logging"
	"os"
)

// TODO: add graceful shutdown
//
//	@title			ЛЦТ-2023 видео-детекция незаконной торговли API
//	@version		0.0.1
//	@description	API документация к решению команды MISIS Banach Space для детекции точек незаконной торгволи
//	@BasePath		/
func main() {
	if err := setup(); err != nil {
		fmt.Printf("error while setting application up: %+v", err)
		os.Exit(-1)
	}

	r, err := router.NewRouter()
	if err != nil {
		logging.Log.Fatal(err)
	}

	logging.Log.Info("starting server")
	logging.Log.Fatal(r.Run())
}

func setup() error {
	if err := config.NewConfig(); err != nil {
		return err
	}

	if err := logging.NewLogger(); err != nil {
		return err
	}

	if err := database.NewPostgres(10); err != nil {
		return err
	}

	return nil
}
