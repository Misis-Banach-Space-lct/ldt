package controller

import (
	"encoding/json"
	"lct/internal/model"
	"lct/internal/response"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type cameraController struct {
	repo      model.CameraRepository
	validator *validator.Validate
	modelName string
}

func NewCameraController(cr model.CameraRepository) cameraController {
	return cameraController{
		repo:      cr,
		validator: validator.New(validator.WithRequiredStructEnabled()),
		modelName: model.CamerasTableName,
	}
}

func (cc *cameraController) CreateOne(c *fiber.Ctx) error {
	var videoData model.CameraCreate
	if err := json.Unmarshal(c.Body(), &videoData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	if err := cc.validator.Struct(&videoData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	if err := cc.repo.InsertOne(c.Context(), videoData); err != nil {
		return response.ErrCreateRecordsFailed(cc.modelName, err)
	}

	// go service.StreamRTSP()

	return c.SendStatus(http.StatusCreated)
}

func (cc *cameraController) CreateMany(c *fiber.Ctx) error {
	var videosData []model.CameraCreate
	if err := json.Unmarshal(c.Body(), &videosData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	if err := cc.validator.Struct(&videosData); err != nil {
		return response.ErrValidationError(cc.modelName, err)
	}

	if err := cc.repo.InsertMany(c.Context(), videosData); err != nil {
		return response.ErrCreateRecordsFailed(cc.modelName, err)
	}

	return c.SendStatus(http.StatusCreated)
}
