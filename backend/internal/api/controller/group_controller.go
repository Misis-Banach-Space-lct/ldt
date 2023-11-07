package controller

import (
	"encoding/json"
	"errors"
	"lct/internal/model"
	"lct/internal/response"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type groupController struct {
	repo      model.GroupRepository
	validator *validator.Validate
	modelName string
}

func NewGroupController(gr model.GroupRepository) groupController {
	return groupController{
		repo:      gr,
		validator: validator.New(validator.WithRequiredStructEnabled()),
		modelName: model.GroupsTableName,
	}
}

// CreateOne godoc
//
//	@Summary		Создание группы
//	@Description	Создание группы с указанным названием, по которой можно агрегировать всех пользователей и созданные подключения к камерам и видео
//	@Tags			groups
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string				true	"Authentication header"
//	@Param			groupData		body		model.GroupCreate	true	"Данные для создания группы"
//	@Success		201				{object}	string				"Группа успешно создана"
//	@Failure		400				{object}	string				"Ошибка при создании группы"
//	@Failure		403				{object}	string				"Доступ запрещен"
//	@Failure		422				{object}	string				"Неверный формат данных"
//	@Router			/api/v1/groups [post]
func (gc *groupController) CreateOne(c *fiber.Ctx) error {
	var groupData model.GroupCreate
	if err := json.Unmarshal(c.Body(), &groupData); err != nil {
		return response.ErrValidationError(gc.modelName, err)
	}

	if err := gc.validator.Struct(&groupData); err != nil {
		return response.ErrValidationError(gc.modelName, err)
	}

	if err := gc.repo.InsertOne(c.Context(), groupData); err != nil {
		return response.ErrCreateRecordsFailed(gc.modelName, err)
	}

	return c.SendStatus(http.StatusCreated)
}

// GetAll godoc
//
//	@Summary		Получение всех групп
//	@Description	Получение всех групп с возможностью пагинации
//	@Tags			groups
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string		true	"Authentication header"
//	@Param			offset			query		int			false	"Offset"	default(0)	validatio:"gte=0"
//	@Param			limit			query		int			false	"Limit"		default(10)	validatio:"gte=1,lte=100"
//	@Success		200				{object}	[]string	"Список групп"
//	@Failure		400				{object}	string		"Ошибка при получении групп"
//	@Failure		403				{object}	string		"Доступ запрещен"
//	@Router			/api/v1/groups [get]
func (gc *groupController) GetAll(c *fiber.Ctx) error {
	offset := c.QueryInt("offset")
	limit := c.QueryInt("limit")
	if offset < 0 || limit < 1 || limit > 100 {
		return response.ErrValidationError("offset or limit", nil)
	}

	groups, err := gc.repo.FindMany(c.Context(), offset, limit)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return response.ErrGetRecordsFailed(gc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(groups)
}

// DeleteOne godoc
//
//	@Summary		Удаление группы
//	@Description	Удаление группы по её id (все зависимые записи из join-таблиц удаляются автоматически)
//	@Tags			groups
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string	true	"Authentication header"
//	@Param			groupId			path		int		true	"Id группы"
//	@Success		204				{object}	string	"Группа успешно удалена"
//	@Failure		400				{object}	string	"Ошибка при удалении группы"
//	@Failure		403				{object}	string	"Доступ запрещен"
//	@Failure		422				{object}	string	"Неверный формат данных"
//	@Router			/api/v1/groups/{groupId} [delete]
func (gc *groupController) DeleteOne(c *fiber.Ctx) error {
	groupId, err := c.ParamsInt("groupId")
	if err != nil {
		return response.ErrValidationError("groupId", err)
	}

	if err := gc.repo.DeleteOne(c.Context(), groupId); err != nil {
		return response.ErrDeleteRecordsFailed(gc.modelName, err)
	}

	return c.SendStatus(http.StatusNoContent)
}
