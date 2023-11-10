package controller

import (
	"lct/internal/model"
	"lct/internal/response"
	"net/http"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type learnFrameController struct {
	learnFrameRepo model.LearnFrameRepository
	userRepo       model.UserRepository
	validator      *validator.Validate
	modelName      string
}

func NewLearnFrameController(lr model.LearnFrameRepository, ur model.UserRepository) learnFrameController {
	return learnFrameController{
		learnFrameRepo: lr,
		userRepo:       ur,
		validator:      validator.New(validator.WithRequiredStructEnabled()),
		modelName:      model.LearnFrameTableName,
	}
}

// CreateOne godoc
//
//	@Summary		Создание кадра для обучения
//	@Description	Создание кадра для обучения с указанными координатами, по которым можно обучать модель
//	@Tags			learnFrames
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string				true	"Authentication header"
//	@Param			width			form		int					true	"Ширина кадра"
//	@Param			height			form		int					true	"Высота кадра"
//	@Param			x				form		int					true	"Координата x"
//	@Param			y				form		int					true	"Координата y"
//	@Param			classId			form		int					true	"Идентификатор класса"
//	@Param			videoId			form		int					true	"Идентификатор видео"
//	@Param			frame			form		file				true	"Кадр для обучения"
//	@Success		201				{object}	string				"Кадр для обучения успешно создан"
//	@Failure		400				{object}	string				"Ошибка при создании кадра для обучения"
//	@Failure		422				{object}	string				"Неверный формат данных"
//	@Router			/api/v1/learnFrames [post]
func (lc *learnFrameController) CreateOne(c *fiber.Ctx) error {
	width, _ := strconv.Atoi(c.FormValue("width"))
	height, _ := strconv.Atoi(c.FormValue("height"))
	x, _ := strconv.Atoi(c.FormValue("x"))
	y, _ := strconv.Atoi(c.FormValue("y"))
	classId, _ := strconv.Atoi(c.FormValue("classId"))
	videoId, _ := strconv.Atoi(c.FormValue("videoId"))
	frame, err := c.FormFile("frame")
	if err != nil {
		return response.ErrValidationError(lc.modelName, err)
	}

	frameData := model.LearnFrameCreate{
		Width:   width,
		Height:  height,
		X:       x,
		Y:       y,
		ClassId: classId,
		VideoId: videoId,
	}

	user, err := lc.userRepo.FindOne(c.Context(), "username", c.Locals("x-username"))
	if err != nil {
		return response.ErrGetRecordsFailed(lc.modelName, err)
	}

	if err := lc.learnFrameRepo.InsertOne(c.Context(), frameData, user.Id); err != nil {
		return response.ErrCreateRecordsFailed(lc.modelName, err)
	}

	c.SaveFile(frame, "./static/learn_frames/"+frame.Filename)

	return c.SendStatus(http.StatusCreated)
}
