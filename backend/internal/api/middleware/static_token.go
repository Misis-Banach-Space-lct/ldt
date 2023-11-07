package middleware

import (
	"lct/internal/response"
	"lct/internal/service"

	"github.com/gofiber/fiber/v2"
)

func StaticTokenMiddleware(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authToken := c.Query("token")
		_, err := service.VerifyAccessToken(authToken, secret)
		if err != nil {
			return response.ErrUnauthorized(err.Error())
		}
		return c.Next()
	}
}
