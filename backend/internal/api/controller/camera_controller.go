package controller

import (
	"encoding/json"
	"lct/internal/logging"
	"lct/internal/model"
	"lct/internal/response"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type cameraController struct {
	cameraRepo model.CameraRepository
	userRepo   model.UserRepository
	groupRepo  model.GroupRepository
	validator  *validator.Validate
	modelName  string
}

func NewCameraController(cr model.CameraRepository, ur model.UserRepository, gr model.GroupRepository) cameraController {
	return cameraController{
		cameraRepo: cr,
		userRepo:   ur,
		groupRepo:  gr,
		validator:  validator.New(validator.WithRequiredStructEnabled()),
		modelName:  model.CamerasTableName,
	}
}

// CreateOne godoc
//
//	@Summary		Создание подключения к камере
//	@Description	Создание подключения к камере (доступно только администратору)
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			cameraData		body		model.CameraCreate	true	"Данные для создания подключения к камере"
//	@Success		201				{string}	string				"Подключение к камере успешно создано"
//	@Failure		403				{object}	string				"Доступ запрещен"
//	@Failure		422				{object}	string				"Неверный формат данных"
//	@Router			/api/v1/cameras	[post]
func (cc *cameraController) CreateOne(c *fiber.Ctx) error {
	var cameraData model.CameraCreate
	if err := json.Unmarshal(c.Body(), &cameraData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}
	logging.Log.Debugf("cameraData: %+v", cameraData)

	if err := cc.validator.Struct(&cameraData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	_, err := cc.cameraRepo.InsertOne(c.Context(), cameraData)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	// TODO: send data to ml

	return c.SendStatus(http.StatusCreated)
}

// CreateMany godoc
//
//	@Summary		Создание подключений к камерам
//	@Description	Создание подключений к камерам (доступно только администратору)
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			camerasData				body		[]model.CameraCreate	true	"Данные для создания подключений к камерам"
//	@Success		201						{string}	string					"Подключения к камерам успешно созданы"
//	@Failure		403						{object}	string					"Доступ запрещен"
//	@Failure		422						{object}	string					"Неверный формат данных"
//	@Router			/api/v1/cameras/many	[post]
func (cc *cameraController) CreateMany(c *fiber.Ctx) error {
	var camerasData []model.CameraCreate
	if err := json.Unmarshal(c.Body(), &camerasData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	if err := cc.validator.Struct(&camerasData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	_, err := cc.cameraRepo.InsertMany(c.Context(), camerasData)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	// TODO: send data to ml

	return c.SendStatus(http.StatusCreated)
}

// GetAll godoc
//
//	@Summary		Получение списка подключений к камерам
//	@Description	Получение списка подключений к камерам
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			filter			query		string			false	"Фильтр поиска"
//	@Param			value			query		string			false	"Значение фильтра"
//	@Success		200				{object}	[]model.Camera	"Подключения к камерам"
//	@Failure		422				{object}	string			"Неверный формат данных"
//	@Router			/api/v1/cameras	[get]
func (cc *cameraController) GetAll(c *fiber.Ctx) error {
	filter := c.Query("filter")
	value := c.Query("value")

	user, err := cc.userRepo.FindOne(c.Context(), "username", c.Locals("x-username"))
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	var groupIds []int
	if user.Role == model.RoleAdmin {
		groups, err := cc.groupRepo.FindMany(c.Context(), 0, -1)
		if err != nil {
			return response.ErrGetRecordsFailed(cc.modelName, err)
		}

		groupIds = make([]int, len(groups))
		for idx, group := range groups {
			groupIds[idx] = group.Id
		}
	} else {
		groupIds, err = cc.userRepo.GetGroups(c.Context(), user.Id)
		if err != nil {
			return response.ErrGetRecordsFailed(cc.modelName, err)
		}
	}

	cameras, err := cc.cameraRepo.FindMany(c.Context(), filter, value, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(cameras)
}

// GetOne godoc
//
//	@Summary		Получение подключения к камере
//	@Description	Получение подключения к камере
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			id						path		int				true	"Id подключения к камере"
//	@Success		200						{object}	model.Camera	"Подключение к камере"
//	@Failure		422						{object}	string			"Неверный формат данных"
//	@Router			/api/v1/cameras/{id}	[get]
func (cc *cameraController) GetOne(c *fiber.Ctx) error {
	cameraId, err := c.ParamsInt("id")
	if err != nil {
		return response.ErrValidationError("cameraId", err)
	}

	user, err := cc.userRepo.FindOne(c.Context(), "username", c.Locals("x-username"))
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	var groupIds []int
	if user.Role == model.RoleAdmin {
		groups, err := cc.groupRepo.FindMany(c.Context(), 0, -1)
		if err != nil {
			return response.ErrGetRecordsFailed(cc.modelName, err)
		}

		groupIds = make([]int, len(groups))
		for idx, group := range groups {
			groupIds[idx] = group.Id
		}
	} else {
		groupIds, err = cc.userRepo.GetGroups(c.Context(), user.Id)
		if err != nil {
			return response.ErrGetRecordsFailed(cc.modelName, err)
		}
	}

	camera, err := cc.cameraRepo.FindOne(c.Context(), "id", cameraId, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(camera)
}

// UpdateGroup godoc
//
//	@Summary		Обновление группы камеры
//	@Description	Обновление группы камеры (доступно только администратору)
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			updateRequest				body		model.CameraGroupUpdate	true	"Данные для обновления группы камеры"
//	@Success		200							{string}	string					"Группа камеры успешно обновлена"
//	@Failure		403							{object}	string					"Доступ запрещен"
//	@Failure		422							{object}	string					"Неверный формат данных"
//	@Router			/api/v1/cameras/updateGroup	[post]
func (cc *cameraController) UpdateGroup(c *fiber.Ctx) error {
	var updateRequest model.CameraGroupUpdate
	if err := json.Unmarshal(c.Body(), &updateRequest); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	if err := cc.validator.Struct(&updateRequest); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	var err error
	switch updateRequest.Action {
	case model.GroupActionAdd:
		err = cc.cameraRepo.AddToGroup(c.Context(), updateRequest.CameraId, updateRequest.GroupId)
	case model.GroupActionRemove:
		err = cc.cameraRepo.RemoveFromGroup(c.Context(), updateRequest.CameraId, updateRequest.GroupId)
	default:
		return response.ErrCustomResponse(http.StatusBadRequest, "invalid action", nil)
	}
	if err != nil {
		return response.ErrCreateRecordsFailed(cc.modelName, err)
	}

	return c.SendStatus(http.StatusOK)
}

// GetFrames godoc
//
//	@Summary		Получение кадров с камеры
//	@Description	Получение кадров с камеры
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int			true	"Id подключения к камере"
//	@Success		200	{object}	[]string	"Кадры с камеры"
//	@Failure		501	{object}	string		"Не реализовано"
func (cc *cameraController) GetFrames(c *fiber.Ctx) error {
	return c.SendStatus(http.StatusNotImplemented)
}

// DeleteOne godoc
//
//	@Summary		Удаление подключения к камере
//	@Description	Удаление подключения к камере (доступно только администратору)
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			id						path		int		true	"Id подключения к камере"
//	@Success		200						{string}	string	"Подключение к камере успешно удалено"
//	@Failure		403						{object}	string	"Доступ запрещен"
//	@Failure		422						{object}	string	"Неверный формат данных"
//	@Router			/api/v1/cameras/{id}	[delete]
func (cc *cameraController) DeleteOne(c *fiber.Ctx) error {
	cameraId, err := c.ParamsInt("id")
	if err != nil {
		return response.ErrValidationError("cameraId", err)
	}

	err = cc.cameraRepo.DeleteOne(c.Context(), cameraId)
	if err != nil {
		return response.ErrDeleteRecordsFailed(cc.modelName, err)
	}

	return c.SendStatus(http.StatusOK)
}
