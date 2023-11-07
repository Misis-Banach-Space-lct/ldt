package middleware

import (
	"errors"
	"lct/internal/database"
	"lct/internal/model"
	"lct/internal/response"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

func CheckAdminRoleMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		currentUsername := c.Locals("x-username")
		db := database.PgConn.GetPool()

		var userRole string
		err := db.QueryRow(c.Context(), `
			select role from `+model.UsersTableName+`
			where username = $1
		`, currentUsername).Scan(&userRole)
		if errors.Is(err, pgx.ErrNoRows) {
			return response.ErrUnauthorized("no such user")
		} else if err != nil {
			return response.ErrGetRecordsFailed(model.UsersTableName, err)
		}

		if userRole != model.RoleAdmin {
			return response.ErrForbidden(c.Route().Path)
		}

		return c.Next()
	}
}
