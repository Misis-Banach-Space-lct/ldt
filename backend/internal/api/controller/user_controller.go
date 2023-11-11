package controller

import (
	"encoding/json"
	"errors"
	"lct/internal/model"
	"lct/internal/response"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/sethvargo/go-password/password"
	"golang.org/x/crypto/bcrypt"
)

// accessible only for admins
type userController struct {
	repo      model.UserRepository
	validator *validator.Validate
	modelName string
}

func NewUserController(ur model.UserRepository) userController {
	return userController{
		repo:      ur,
		validator: validator.New(validator.WithRequiredStructEnabled()),
		modelName: model.UsersTableName,
	}
}

// CreateOne godoc
//
//	@Summary		Создание пользователя
//	@Description	Создание пользователя с указанными данными (доступно только для администраторов)
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string				true	"Authentication header"
//	@Param			userData		body		model.UserCreate	true	"Данные для создания пользователя"
//	@Success		201				{object}	object				"Пользователь успешно создан"
//	@Failure		400				{object}	string				"Ошибка при создании пользователя"
//	@Failure		403				{object}	string				"Доступ запрещен"
//	@Failure		422				{object}	string				"Неверный формат данных"
//	@Router			/api/v1/users [post]
func (uc *userController) CreateOne(c *fiber.Ctx) error {
	var userData model.UserCreate
	if err := json.Unmarshal(c.Body(), &userData); err != nil {
		return response.ErrValidationError(uc.modelName, err)
	}

	if err := uc.validator.Struct(&userData); err != nil {
		return response.ErrValidationError(uc.modelName, err)
	}

	username := uuid.NewString()
	plainPassword, err := password.Generate(16, 5, 0, false, false)
	if err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "failed to generate password", err)
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "failed to hash password", err)
	}

	userData.Username = username
	userData.Password = string(hashedPassword)

	if err := uc.repo.InsertOne(c.Context(), userData); err != nil {
		return response.ErrCreateRecordsFailed(uc.modelName, err)
	}

	return c.Status(http.StatusCreated).JSON(map[string]any{
		"username": username,
		"password": plainPassword,
	})
}

// GetAll godoc
//
//	@Summary		Получение всех пользователей
//	@Description	Получение всех пользователей с возможностью пагинации (доступно только для администраторов)
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string			true	"Authentication header"
//	@Param			filter			query		string			false	"Фильтр"			default(groupId)	enums(groupId, role)
//	@Param			value			query		string			false	"Значение фильтра"	default(0)
//	@Param			offset			query		int				false	"Offset"			default(0)	validation:"gte=0"
//	@Param			limit			query		int				false	"Limit"				default(10)	validation:"gte=1,lte=100"
//	@Success		200				{object}	[]model.User	"Список пользователей"
//	@Failure		400				{object}	string			"Ошибка при получении пользователей"
//	@Failure		403				{object}	string			"Доступ запрещен"
//	@Router			/api/v1/users [get]
func (uc *userController) GetAllByFilter(c *fiber.Ctx) error {
	filter := c.Query("filter")
	value := c.Query("value")
	offset := c.QueryInt("offset")
	limit := c.QueryInt("limit")
	if offset < 0 || limit < 1 || limit > 100 {
		return response.ErrValidationError("offset or limit", nil)
	}

	users, err := uc.repo.FindMany(c.Context(), filter, value, offset, limit)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return response.ErrGetRecordsFailed(uc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(users)
}

// DeleteOne godoc
//
//	@Summary		Удаление пользователя
//	@Description	Удаление пользователя по его id (все зависимые записи из join-таблиц удаляются автоматически, доступно только для администраторов)
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string	true	"Authentication header"
//	@Param			userId			path		int		true	"Id пользователя"
//	@Success		204				{object}	string	"Пользователь успешно удален"
//	@Failure		400				{object}	string	"Ошибка при удалении пользователя"
//	@Failure		403				{object}	string	"Доступ запрещен"
//	@Failure		422				{object}	string	"Неверный формат данных"
//	@Router			/api/v1/users/{userId} [delete]
func (uc *userController) DeleteOne(c *fiber.Ctx) error {
	userId, err := c.ParamsInt("userId")
	if err != nil {
		return response.ErrValidationError("userId", err)
	}

	if err := uc.repo.DeleteOne(c.Context(), userId); err != nil {
		return response.ErrDeleteRecordsFailed(uc.modelName, err)
	}

	return c.SendStatus(http.StatusNoContent)
}

// UpdateGroup godoc
//
//	@Summary		Добавление/удаление пользователя из группы
//	@Description	Добавление/удаление пользователя из группы по его id (доступно только для администраторов)
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"Authentication header"
//	@Param			updateData		body		model.UserGroupUpdate	true	"Данные для добавления/удаления пользователя из группы"
//	@Success		204				{object}	string					"Пользователь успешно добавлен/удален из группы"
//	@Failure		400				{object}	string					"Ошибка при добавлении/удалении пользователя из группы"
//	@Failure		403				{object}	string					"Доступ запрещен"
//	@Failure		422				{object}	string					"Неверный формат данных"
//	@Router			/api/v1/users/updateGroup [post]
func (uc *userController) UpdateGroup(c *fiber.Ctx) error {
	var updateData model.UserGroupUpdate
	if err := json.Unmarshal(c.Body(), &updateData); err != nil {
		return response.ErrValidationError(uc.modelName, err)
	}

	if err := uc.validator.Struct(&updateData); err != nil {
		return response.ErrValidationError(uc.modelName, err)
	}

	var err error
	switch updateData.Action {
	case model.GroupActionAdd:
		err = uc.repo.AddToGroup(c.Context(), updateData.UserId, updateData.GroupId)
	case model.GroupActionRemove:
		err = uc.repo.RemoveFromGroup(c.Context(), updateData.UserId, updateData.GroupId)
	default:
		return response.ErrCustomResponse(http.StatusBadRequest, "invalid action", nil)
	}
	if err != nil {
		return response.ErrCreateRecordsFailed(uc.modelName+"_group", err)
	}

	return c.SendStatus(http.StatusNoContent)
}
