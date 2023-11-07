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

func (r *Router) setupUserRoutes(group fiber.Router) error {
	userRepository, err := repository.NewUserPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("users router: %+v", err)}
	}
	userController := controller.NewUserController(userRepository)

	users := group.Group("/users")
	users.Use(middleware.CheckAdminRoleMiddleware())

	users.Get("/", userController.GetAllByFilter)
	users.Post("/", userController.CreateOne)
	users.Post("/updateGroup", userController.UpdateGroup)
	users.Delete("/:userId", userController.DeleteOne)

	return nil
}
