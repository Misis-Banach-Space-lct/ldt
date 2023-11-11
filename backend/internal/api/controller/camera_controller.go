package controller

import (
	"encoding/json"
	"fmt"
	"lct/internal/logging"
	"lct/internal/model"
	"lct/internal/response"
	"lct/internal/service"
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

	cameraId, err := cc.cameraRepo.InsertOne(c.Context(), cameraData)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	go service.ProcessStream(cameraId, cameraData.Url)

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

	cameraIds, err := cc.cameraRepo.InsertMany(c.Context(), camerasData)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	for idx, cameraData := range camerasData {
		go service.ProcessStream(cameraIds[idx], cameraData.Url)
	}

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
//	@Param			uuid					path		string			true	"Uuid подключения к камере"
//	@Success		200						{object}	model.Camera	"Подключение к камере"
//	@Failure		422						{object}	string			"Неверный формат данных"
//	@Router			/api/v1/cameras/{uuid}	[get]
func (cc *cameraController) GetOne(c *fiber.Ctx) error {
	cameraUuid := c.Params("uuid")

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

	camera, err := cc.cameraRepo.FindOne(c.Context(), "connUuid", cameraUuid, groupIds)
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
	groups, err := cc.groupRepo.FindMany(c.Context(), 0, -1)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	groupIds := make([]int, len(groups))
	for idx, group := range groups {
		groupIds[idx] = group.Id
	}

	camera, err := cc.cameraRepo.FindOne(c.Context(), "connUuid", updateRequest.CameraUuid, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	switch updateRequest.Action {
	case model.GroupActionAdd:
		err = cc.cameraRepo.AddToGroup(c.Context(), camera.Id, updateRequest.GroupId)
	case model.GroupActionRemove:
		err = cc.cameraRepo.RemoveFromGroup(c.Context(), camera.Id, updateRequest.GroupId)
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
//	@Param			uuid							path		string		true	"Uuid подключения к камере"
//	@Success		200								{object}	[]string	"Кадры с камеры"
//	@Router			/api/v1/cameras/{uuid}/frames	[get]
func (cc *cameraController) GetFrames(c *fiber.Ctx) error {
	cameraUuid := c.Params("uuid")

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

	camera, err := cc.cameraRepo.FindOne(c.Context(), "connUuid", cameraUuid, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	var frames []string
	paths := []string{
		fmt.Sprintf("static/processed/s_frames/%d", camera.Id),
		fmt.Sprintf("static/processed/s_frames_a/%d", camera.Id),
		fmt.Sprintf("static/processed/s_frames_h/%d", camera.Id),
	}
	for _, path := range paths {
		curFrames, err := getDirFiles(path)
		if err != nil {
			continue
		}

		frames = append(frames, curFrames...)
	}

	return c.Status(http.StatusOK).JSON(frames)
}

// DeleteOne godoc
//
//	@Summary		Удаление подключения к камере
//	@Description	Удаление подключения к камере (доступно только администратору)
//	@Tags			cameras
//	@Accept			json
//	@Produce		json
//	@Param			uuid					path		string	true	"Id подключения к камере"
//	@Success		200						{string}	string	"Подключение к камере успешно удалено"
//	@Failure		403						{object}	string	"Доступ запрещен"
//	@Failure		422						{object}	string	"Неверный формат данных"
//	@Router			/api/v1/cameras/{uuid}	[delete]
func (cc *cameraController) DeleteOne(c *fiber.Ctx) error {
	cameraUuid := c.Params("uuid")

	groups, err := cc.groupRepo.FindMany(c.Context(), 0, -1)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	groupIds := make([]int, len(groups))
	for idx, group := range groups {
		groupIds[idx] = group.Id
	}

	camera, err := cc.cameraRepo.FindOne(c.Context(), "connUuid", cameraUuid, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(cc.modelName, err)
	}

	err = cc.cameraRepo.DeleteOne(c.Context(), camera.Id)
	if err != nil {
		return response.ErrDeleteRecordsFailed(cc.modelName, err)
	}

	return c.SendStatus(http.StatusOK)
}
