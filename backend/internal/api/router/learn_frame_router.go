package router

import (
	"fmt"
	"lct/internal/api/controller"
	"lct/internal/database"
	"lct/internal/model"
	"lct/internal/repository"

	"github.com/gofiber/fiber/v2"
)

func (r *Router) setupLearnFrameRoutes(group fiber.Router) error {
	learnFrameRepo, err := repository.NewLearnFramePgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("learn frames router: %+v", err)}
	}
	userRepo, err := repository.NewUserPgRepository(database.PgConn.GetPool())
	learnFrameController := controller.NewLearnFrameController(learnFrameRepo, userRepo)

	learnFrames := group.Group("/learnFrames")

	learnFrames.Post("/", learnFrameController.CreateOne)

	return nil
}
