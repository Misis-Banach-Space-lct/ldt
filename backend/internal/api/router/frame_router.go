package router

import (
	"fmt"
	"lct/internal/api/controller"
	"lct/internal/database"
	"lct/internal/model"
	"lct/internal/repository"

	"github.com/gofiber/fiber/v2"
)

func (r *Router) setupFrameRoutes(group fiber.Router) error {
	learnFrameRepo, err := repository.NewLearnFramePgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("learn frames router: %+v", err)}
	}
	userRepo, err := repository.NewUserPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("learn frames router: %+v", err)}
	}
	mlFrameRepo, err := repository.NewMlFramePgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("learn frames router: %+v", err)}
	}
	frameController := controller.NewFrameController(learnFrameRepo, userRepo, mlFrameRepo)

	frames := group.Group("/frames")

	frames.Get("/ml/:videoId", frameController.GetAll)
	frames.Post("/learn", frameController.CreateOne)

	return nil
}
