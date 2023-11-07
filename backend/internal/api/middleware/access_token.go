package middleware

import (
	"lct/internal/response"
	"lct/internal/service"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AccessTokenMiddleware(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		t := strings.Split(authHeader, " ")
		if len(t) != 2 {
			return response.ErrUnauthorized("no token provided")
		}

		authToken := t[1]
		token, err := service.VerifyAccessToken(authToken, secret)
		if err != nil {
			return response.ErrUnauthorized(err.Error())
		}

		username, err := token.Claims.GetSubject()
		if err != nil {
			return response.ErrUnauthorized(err.Error())
		}

		c.Locals("x-username", username)
		return c.Next()
	}
}
