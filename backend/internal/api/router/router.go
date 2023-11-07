package router

import (
	_ "lct/docs"
	"lct/internal/api/middleware"
	"lct/internal/config"
	"lct/internal/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"
)

type Router struct {
	engine *fiber.App
}

func NewRouter() (*Router, error) {
	r := &Router{
		engine: fiber.New(),
	}

	if err := r.setup(); err != nil {
		return nil, err
	}

	return r, nil
}

func (r *Router) setup() error {
	r.engine.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "*",
		AllowMethods: "*",
	}))
	r.engine.Use(logger.New(logger.ConfigDefault))
	r.engine.Use(recover.New(recover.ConfigDefault))
	r.engine.Get("/swagger/*", swagger.HandlerDefault)

	r.engine.Static("/static", "./static")
	r.engine.Use("/static", middleware.StaticTokenMiddleware(config.Cfg.JwtSecret))

	auth := r.engine.Group("/auth")
	if err := r.setupAuthRoutes(auth); err != nil {
		return err
	}

	v1 := r.engine.Group("/api/v1")
	v1.Use(middleware.AccessTokenMiddleware(config.Cfg.JwtSecret))
	if err := r.setupUserRoutes(v1); err != nil {
		return err
	}
	if err := r.setupGroupRoutes(v1); err != nil {
		return err
	}
	if err := r.setupCameraRoutes(v1); err != nil {
		return err
	}
	if err := r.setupVideoRoutes(v1); err != nil {
		return err
	}
	if err := database.PgConn.CreateJoinTables(); err != nil {
		return err
	}

	return nil
}

func (r *Router) Run() error {
	return r.engine.Listen(":" + config.Cfg.ServerPort)
}
