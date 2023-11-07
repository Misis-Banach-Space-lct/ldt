package controller

import (
	"encoding/json"
	"errors"
	"lct/internal/config"
	"lct/internal/model"
	"lct/internal/response"
	"lct/internal/service"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type authController struct {
	repo      model.UserRepository
	validator *validator.Validate
	modelName string
}

func NewAuthController(ur model.UserRepository) authController {
	return authController{
		repo:      ur,
		validator: validator.New(validator.WithRequiredStructEnabled()),
		modelName: model.UsersTableName,
	}
}

// Register godoc
//
//	@Summary		Авторизация
//	@Description	Авторизоваться в системе с помощью заранее сгенерированных логина и пароля
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			loginData	body		model.UserLogin		true	"Данные для авторизации"
//	@Success		200			{object}	model.AuthResponse	"Access token, значение для header Authorization"
//	@Failure		401			{object}	string				"Не авторизован"
//	@Failure		422			{object}	string				"Неверный формат данных"
//	@Router			/auth/login [post]
func (ac *authController) Login(c *fiber.Ctx) error {
	var loginData model.UserLogin
	if err := json.Unmarshal(c.Body(), &loginData); err != nil {
		return response.ErrValidationError(ac.modelName, err)
	}

	if err := ac.validator.Struct(&loginData); err != nil {
		return response.ErrValidationError(ac.modelName, err)
	}

	user, err := ac.repo.FindOne(c.Context(), "username", loginData.Username)
	if errors.Is(err, pgx.ErrNoRows) {
		return response.ErrUnauthorized("no such user")
	} else if err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "failed to find user", err)
	}

	authResponse, err := service.AuthenticateUser(loginData.Username, user.Password, loginData.Password, user.Role, config.Cfg.JwtSecret)
	if err != nil {
		return response.ErrUnauthorized(err.Error())
	}

	return c.Status(http.StatusOK).JSON(authResponse)
}
