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

func (r *Router) setupVideoRoutes(group fiber.Router) error {
	message := "videos router: %+v"
	videoRepository, err := repository.NewVideoPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf(message, err)}
	}
	userRepository, err := repository.NewUserPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf(message, err)}
	}
	groupRepository, err := repository.NewGroupPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf(message, err)}
	}
	mlFrameRepository, err := repository.NewMlFramePgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf(message, err)}
	}
	videoController := controller.NewVideoController(videoRepository, userRepository, groupRepository, mlFrameRepository)

	videos := group.Group("/videos")
	videos.Get("/", videoController.GetAllByFilter)
	videos.Get("/:id", videoController.GetOneById)
	videos.Get("/:id/frames", videoController.GetFrames)

	videos.Post("/", middleware.CheckAdminRoleMiddleware(), videoController.CreateOne)
	videos.Post("/many", middleware.CheckAdminRoleMiddleware(), videoController.CreateMany)
	videos.Post("/updateGroup", middleware.CheckAdminRoleMiddleware(), videoController.UpdateGroup)
	videos.Delete("/:id", middleware.CheckAdminRoleMiddleware(), videoController.DeleteOne)

	return nil
}
