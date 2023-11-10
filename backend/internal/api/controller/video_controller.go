package controller

import (
	"encoding/json"
	"fmt"
	"lct/internal/model"
	"lct/internal/response"
	"lct/internal/service"
	"net/http"
	"strconv"
	"strings"

	"archive/zip"
	"io"
	"os"
	"path/filepath"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type videoController struct {
	videoRepo   model.VideoRepository
	userRepo    model.UserRepository
	groupRepo   model.GroupRepository
	mlFrameRepo model.MlFrameRepository
	validator   *validator.Validate
	modelName   string
}

func NewVideoController(vr model.VideoRepository, ur model.UserRepository, gr model.GroupRepository, mr model.MlFrameRepository) videoController {
	return videoController{
		videoRepo:   vr,
		userRepo:    ur,
		groupRepo:   gr,
		mlFrameRepo: mr,
		validator:   validator.New(validator.WithRequiredStructEnabled()),
		modelName:   model.VideosTableName,
	}
}

func getDirFiles(framesPath string) ([]string, error) {
	files, err := os.ReadDir(framesPath)
	if err != nil {
		return nil, err
	}

	var frames []string
	for _, file := range files {
		frames = append(frames, framesPath+"/"+file.Name())
	}

	return frames, nil
}

// CreateOne godoc
//
//	@Summary		Создание видео
//	@Description	Создание видео с указанными данными (доступно только для администраторов)
//	@Tags			videos
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			Authorization	header		string				true	"Authentication header"
//	@Param			video			formData	file				true	"Видео файл"
//	@Param			title			formData	string				false	"Название видео"
//	@Param			groupId			formData	int					false	"ID группы, к которой принадлежит видео, 0 - для всех"
//	@Success		201				{object}	model.VideoCreate	"Видео успешно создано"
//	@Failure		400				{object}	string				"Ошибка при создании видео"
//	@Failure		403				{object}	string				"Доступ запрещен"
//	@Failure		422				{object}	string				"Неверный формат данных"
//	@Router			/api/v1/videos [post]
func (vc *videoController) CreateOne(c *fiber.Ctx) error {
	video, err := c.FormFile("video")
	if err != nil {
		return response.ErrValidationError("static video file", err)
	}

	title := c.FormValue("title", video.Filename)
	groupId, err := strconv.Atoi(c.FormValue("groupId", "0"))
	if err != nil {
		return response.ErrValidationError("group id", err)
	}

	videoData := model.VideoCreate{
		Title:   title,
		Source:  "static/videos/" + strings.ReplaceAll(video.Filename, " ", "_"),
		GroupId: groupId,
	}

	videoId, err := vc.videoRepo.InsertOne(c.Context(), videoData)
	if err != nil {
		return response.ErrCreateRecordsFailed(vc.modelName, err)
	}

	if err := c.SaveFile(video, videoData.Source); err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "failed to save video file", err)
	}

	go service.ProcessVideoMl(videoId, videoData.Source, video.Filename, vc.videoRepo, vc.mlFrameRepo)
	go service.ProcessVideoFrames(videoId, videoData.Source)

	return c.Status(http.StatusCreated).JSON(videoData)
}

// CreateMany godoc
//
//	@Summary		Создание нескольких видео из архива
//	@Description	Создание нескольких видео из архива с указанными данными (доступно только для администраторов)
//	@Tags			videos
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			Authorization	header		string	true	"Authentication header"
//	@Param			archive			formData	file	true	"Архив с видео"
//	@Param			title			formData	string	false	"Название видео (будет добавлено к названию каждого видео)"
//	@Param			groupId			formData	int		false	"ID группы, к которой принадлежит видео (все видео будут добавлены в эту группу), 0 - для всех"
//	@Success		201				{object}	object	"Видео успешно созданы"
//	@Failure		400				{object}	string	"Ошибка при создании видео"
//	@Failure		403				{object}	string	"Доступ запрещен"
//	@Failure		422				{object}	string	"Неверный формат данных"
//	@Router			/api/v1/videos/many [post]
func (vc *videoController) CreateMany(c *fiber.Ctx) error {
	title := c.FormValue("title", "archive"+uuid.NewString())
	groupId, err := strconv.Atoi(c.FormValue("groupId", "0"))
	if err != nil {
		return response.ErrValidationError("group id", err)
	}

	archive, err := c.FormFile("archive")
	if err != nil {
		return response.ErrValidationError("archive file", err)
	}

	if err := c.SaveFile(archive, archive.Filename); err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "failed to save archive file", err)
	}

	zipReader, err := zip.OpenReader(archive.Filename)
	if err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "can't unzip archive", err)
	}
	defer zipReader.Close()
	defer os.Remove(archive.Filename)

	var videosData []model.VideoCreate
	for idx, file := range zipReader.File {
		if file.FileInfo().IsDir() {
			continue
		}

		fileReader, err := file.Open()
		if err != nil {
			return response.ErrCustomResponse(http.StatusInternalServerError, fmt.Sprintf("can't open %s video file", file.Name), err)
		}
		defer fileReader.Close()

		fileName := strings.ReplaceAll(file.Name, " ", "_")
		t := fmt.Sprintf("%s-%d-%s", title, idx, fileName)
		videosData = append(videosData, model.VideoCreate{
			Title:   t,
			Source:  "static/videos/" + fileName,
			GroupId: groupId,
		})

		filePath := filepath.Join("static/videos", file.Name)
		fileWriter, err := os.Create(filePath)
		if err != nil {
			return response.ErrCustomResponse(http.StatusInternalServerError, fmt.Sprintf("failed to create %s file", t), err)
		}
		defer fileWriter.Close()

		if _, err := io.Copy(fileWriter, fileReader); err != nil {
			return response.ErrCustomResponse(http.StatusInternalServerError, fmt.Sprintf("failed to copy %s file", t), err)
		}
	}

	videoIds, err := vc.videoRepo.InsertMany(c.Context(), videosData)
	if err != nil {
		return response.ErrCreateRecordsFailed(vc.modelName, err)
	}

	go func() {
		for idx, videoId := range videoIds {
			go service.ProcessVideoMl(videoId, videosData[idx].Source, zipReader.File[idx].FileInfo().Name(), vc.videoRepo, vc.mlFrameRepo)
			go service.ProcessVideoFrames(videoId, videosData[idx].Source)
		}
	}()

	return c.Status(http.StatusCreated).JSON(videosData)
}

// GetAllByFilter godoc
//
//	@Summary		Получение всех видео по фильтру
//	@Description	Получение всех видео по фильтру с возможностью пагинации (полтзователи могут получать только видео из своих групп)
//	@Tags			videos
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string			true	"Authentication header"
//	@Param			filter			query		string			false	"Фильтр поиска"		default(groupId)	enums(status, groupId)
//	@Param			value			query		string			false	"Значение фильтра"	default(0)
//	@Param			offset			query		int				false	"Offset"			default(0)	validation:"gte=0"
//	@Param			limit			query		int				false	"Limit"				default(10)	validation:"gte=1,lte=100"
//	@Success		200				{object}	[]model.Video	"Список видео"
//	@Failure		400				{object}	string			"Ошибка при получении видео"
//	@Failure		403				{object}	string			"Доступ запрещен"
//	@Failure		422				{object}	string			"Неверный формат данных"
//	@Router			/api/v1/videos [get]
func (vc *videoController) GetAllByFilter(c *fiber.Ctx) error {
	filter := c.Query("filter")
	value := c.Query("value")
	offset := c.QueryInt("offset")
	limit := c.QueryInt("limit")
	if offset < 0 || limit < 1 || limit > 100 {
		return response.ErrValidationError("offset or limit", nil)
	}

	user, err := vc.userRepo.FindOne(c.Context(), "username", c.Locals("x-username"))
	if err != nil {
		return response.ErrGetRecordsFailed(vc.modelName, err)
	}

	var groupIds []int
	if user.Role == model.RoleAdmin {
		groups, err := vc.groupRepo.FindMany(c.Context(), 0, -1)
		if err != nil {
			return response.ErrGetRecordsFailed("groups", err)
		}

		groupIds = make([]int, len(groups))
		for _, group := range groups {
			groupIds = append(groupIds, group.Id)
		}
	} else {
		groupIds, err = vc.userRepo.GetGroups(c.Context(), user.Id)
		if err != nil {
			return response.ErrGetRecordsFailed("groups", err)
		}
	}

	videos, err := vc.videoRepo.FindMany(c.Context(), filter, value, offset, limit, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(vc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(videos)
}

// GetOneById godoc
//
//	@Summary		Получение видео по id
//	@Description	Получение видео по id (пользователи могут получать только видео из своих групп)
//	@Tags			videos
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string		true	"Authentication header"
//	@Param			id				path		int			true	"Id видео"
//	@Success		200				{object}	model.Video	"Видео"
//	@Failure		400				{object}	string		"Ошибка при получении видео"
//	@Failure		403				{object}	string		"Доступ запрещен"
//	@Failure		422				{object}	string		"Неверный формат данных"
//	@Router			/api/v1/videos/{id} [get]
func (vc *videoController) GetOneById(c *fiber.Ctx) error {
	videoId, err := c.ParamsInt("id")
	if err != nil {
		return response.ErrValidationError("video id", err)
	}

	user, err := vc.userRepo.FindOne(c.Context(), "username", c.Locals("x-username"))
	if err != nil {
		return response.ErrGetRecordsFailed(vc.modelName, err)
	}

	var groupIds []int
	if user.Role == model.RoleAdmin {
		groups, err := vc.groupRepo.FindMany(c.Context(), 0, -1)
		if err != nil {
			return response.ErrGetRecordsFailed("groups", err)
		}

		groupIds = make([]int, len(groups))
		for _, group := range groups {
			groupIds = append(groupIds, group.Id)
		}
	} else {
		groupIds, err = vc.userRepo.GetGroups(c.Context(), user.Id)
		if err != nil {
			return response.ErrGetRecordsFailed("groups", err)
		}
	}

	video, err := vc.videoRepo.FindOne(c.Context(), "id", videoId, groupIds)
	if err != nil {
		return response.ErrGetRecordsFailed(vc.modelName, err)
	}

	return c.Status(http.StatusOK).JSON(video)
}

// UpdateGroup godoc
//
//	@Summary		Добавление/удаление видео из группы
//	@Description	Добавление/удаление видео из гурппы по id (доступно только для администраторов)
//	@Tags			videos
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"Authentication header"
//	@Param			updateData		body		model.VideoUpdateGroup	true	"Данные для обновления"
//	@Success		204				{object}	string					"Видео успешно обновлено"
//	@Failure		400				{object}	string					"Ошибка при обновлении видео"
//	@Failure		403				{object}	string					"Доступ запрещен"
//	@Failure		422				{object}	string					"Неверный формат данных"
//	@Router			/api/v1/videos/updateGroup [post]
func (vc *videoController) UpdateGroup(c *fiber.Ctx) error {
	var updateData model.VideoUpdateGroup
	if err := json.Unmarshal(c.Body(), &updateData); err != nil {
		return response.ErrValidationError(vc.modelName, err)
	}

	if err := vc.validator.Struct(&updateData); err != nil {
		return response.ErrValidationError(vc.modelName, err)
	}

	var err error
	switch updateData.Action {
	case model.GroupActionAdd:
		err = vc.videoRepo.AddToGroup(c.Context(), updateData.VideoId, updateData.GroupId)
	case model.GroupActionRemove:
		err = vc.videoRepo.RemoveFromGroup(c.Context(), updateData.VideoId, updateData.GroupId)
	default:
		return response.ErrCustomResponse(http.StatusBadRequest, "invalid action", nil)
	}
	if err != nil {
		return response.ErrCreateRecordsFailed(vc.modelName+"_group", err)
	}

	return c.SendStatus(http.StatusNoContent)
}

// GetFrames godoc
//
//	@Summary		Получение кадров видео
//	@Description	Получение кадров видео по id
//	@Tags			videos
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int			true	"Id видео"
//	@Param			type	query		string		false	"Тип кадров (processed - обработанные, иначе - исходные)"	enums(processed, default)
//	@Success		200		{object}	[]string	"Список кадров видео"
//	@Failure		404		{object}	string		"Кадры видео не найдены"
//	@Router			/api/v1/videos/{id}/frames [get]
func (vc *videoController) GetFrames(c *fiber.Ctx) error {
	videoId, err := c.ParamsInt("id")
	if err != nil {
		return response.ErrValidationError("video id", err)
	}

	framesType := c.Query("type")
	var paths []string
	var frames []string
	if framesType == "processed" {
		paths = []string{
			fmt.Sprintf("static/processed/frames/%d", videoId),
			fmt.Sprintf("static/processed/frames_h/%d", videoId),
		}
	} else {
		paths = []string{fmt.Sprintf("static/frames/%d", videoId)}
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
//	@Summary		Удаление видео
//	@Description	Удаление видео по id (доступно только для администраторов)
//	@Tags			videos
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string	true	"Authentication header"
//	@Param			id				path		int		true	"Id видео"
//	@Success		204				{object}	string	"Видео успешно удалено"
//	@Failure		400				{object}	string	"Ошибка при удалении видео"
//	@Failure		403				{object}	string	"Доступ запрещен"
//	@Failure		422				{object}	string	"Неверный формат данных"
//	@Router			/api/v1/videos/{id} [delete]
func (vc *videoController) DeleteOne(c *fiber.Ctx) error {
	videoId, err := c.ParamsInt("id")
	if err != nil {
		return response.ErrValidationError("video id", err)
	}

	if err := vc.videoRepo.DeleteOne(c.Context(), videoId); err != nil {
		return response.ErrDeleteRecordsFailed(vc.modelName, err)
	}

	return c.SendStatus(http.StatusNoContent)
}
