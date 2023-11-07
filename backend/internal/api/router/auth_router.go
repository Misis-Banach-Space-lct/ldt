package router

import (
	"fmt"
	"lct/internal/api/controller"
	"lct/internal/database"
	"lct/internal/model"
	"lct/internal/repository"

	"github.com/gofiber/fiber/v2"
)

func (r *Router) setupAuthRoutes(auth fiber.Router) error {
	userRepository, err := repository.NewUserPgRepository(database.PgConn.GetPool())
	if err != nil {
		return model.ErrRouterSetupFailed{Message: fmt.Sprintf("auth router: %+v", err)}
	}
	authController := controller.NewAuthController(userRepository)

	auth.Post("/login", authController.Login)

	return nil
}
