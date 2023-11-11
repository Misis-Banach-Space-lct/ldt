package router

import (
	"fmt"
	"lct/internal/api/controller"
	"lct/internal/api/middleware"
	"lct/internal/database"
	"lct/internal/model"
	"lct/internal/repository"

	"github.com/gofiber/fiber/v2"
)

func (r *Router) setupCameraRoutes(group fiber.Router) error {
	userRepository, err := repository.NewUserPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("cameras router, userRepo: %+v", err)}
	}
	groupRepository, err := repository.NewGroupPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("cameras router, groupRepo: %+v", err)}
	}
	cameraRepository, err := repository.NewCameraPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("cameras router, camreRepo: %+v", err)}
	}
	cameraController := controller.NewCameraController(cameraRepository, userRepository, groupRepository)

	cameras := group.Group("/cameras")
	cameras.Get("/", cameraController.GetAll)
	cameras.Get("/:uuid", cameraController.GetOne)
	cameras.Get("/:uuid/frames", cameraController.GetFrames)

	cameras.Post("/", middleware.CheckAdminRoleMiddleware(), cameraController.CreateOne)
	cameras.Post("/many", middleware.CheckAdminRoleMiddleware(), cameraController.CreateMany)
	cameras.Post("/updateGroup", middleware.CheckAdminRoleMiddleware(), cameraController.UpdateGroup)
	cameras.Delete("/:uuid", middleware.CheckAdminRoleMiddleware(), cameraController.DeleteOne)

	return nil
}
