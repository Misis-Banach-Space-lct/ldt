package router

import (
	"fmt"
	"lct/internal/api/controller"
	"lct/internal/database"
	"lct/internal/model"
	"lct/internal/repository"

	"github.com/gofiber/fiber/v2"
)

func (r *Router) setupCameraRoutes(group fiber.Router) error {
	cameraRepository, err := repository.NewCameraPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("cameras router: %+v", err)}
	}
	cameraController := controller.NewCameraController(cameraRepository)

	cameras := group.Group("/cameras")
	cameras.Post("/createOne", cameraController.CreateOne)

	return nil
}
