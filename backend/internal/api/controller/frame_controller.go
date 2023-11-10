package controller

import (
	"lct/internal/model"
	"lct/internal/response"
	"net/http"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type frameController struct {
	learnFrameRepo model.LearnFrameRepository
	userRepo       model.UserRepository
	mlFrameRepo    model.MlFrameRepository
	validator      *validator.Validate
	modelName      string
}

func NewFrameController(lr model.LearnFrameRepository, ur model.UserRepository, mr model.MlFrameRepository) frameController {
	return frameController{
		learnFrameRepo: lr,
		userRepo:       ur,
		mlFrameRepo:    mr,
		validator:      validator.New(validator.WithRequiredStructEnabled()),
		modelName:      model.LearnFrameTableName,
	}
}

// GetAll godoc
//
//	@Summary		Получение всех кадров с предсказанными классами
//	@Description	Получение всех кадров с предсказанными классами
//	@Tags			mlFrames
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string			true	"Authentication header"
//	@Param			videoId			path		int				true	"Id видео"
//	@Success		200				{object}	[]model.MlFrame	"Полученные кадры"
//	@Failure		422				{object}	string			"Неверный формат данных"
//	@Router			/api/v1/frames/ml/{videoId} [get]
func (fc *frameController) GetAll(c *fiber.Ctx) error {
	videoId, err := c.ParamsInt("videoId")
	if err != nil {
		return response.ErrValidationError("videoId", err)
	}

	frames, err := fc.mlFrameRepo.FindMany(c.Context(), videoId)
	if err != nil {
		return response.ErrGetRecordsFailed(fc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(frames)
}

// CreateOne godoc
//
//	@Summary		Создание кадра для обучения
//	@Description	Создание кадра для обучения с указанными координатами, по которым можно обучать модель
//	@Tags			learnFrames
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string	true	"Authentication header"
//	@Param			width			formData	int		true	"Ширина кадра"
//	@Param			height			formData	int		true	"Высота кадра"
//	@Param			x				formData	int		true	"Координата x"
//	@Param			y				formData	int		true	"Координата y"
//	@Param			classId			formData	int		true	"Идентификатор класса"
//	@Param			videoId			formData	int		true	"Идентификатор видео"
//	@Param			frame			formData	file	true	"Кадр для обучения"
//	@Success		201				{object}	string	"Кадр для обучения успешно создан"
//	@Failure		400				{object}	string	"Ошибка при создании кадра для обучения"
//	@Failure		422				{object}	string	"Неверный формат данных"
//	@Router			/api/v1/frames/learn [post]
func (lc *frameController) CreateOne(c *fiber.Ctx) error {
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
