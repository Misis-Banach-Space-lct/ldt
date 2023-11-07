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

func (r *Router) setupGroupRoutes(group fiber.Router) error {
	groupRepository, err := repository.NewGroupPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("groups router: %+v", err)}
	}
	groupController := controller.NewGroupController(groupRepository)

	groups := group.Group("/groups")
	groups.Use(middleware.CheckAdminRoleMiddleware())

	groups.Get("/", groupController.GetAll)
	groups.Post("/", groupController.CreateOne)
	groups.Delete("/:groupId", groupController.DeleteOne)

	return nil
}
