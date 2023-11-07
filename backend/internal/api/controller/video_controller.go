package controller

import (
	"encoding/json"
	"fmt"
	"lct/internal/logging"
	"lct/internal/model"
	"lct/internal/response"
	"math/rand"
	"net/http"
	"os/exec"
	"reflect"
	"strconv"
	"strings"
	"time"

	"archive/zip"
	"io"
	"os"
	"path/filepath"

	"github.com/go-playground/validator/v10"
	"github.com/gocelery/gocelery"
	"github.com/gofiber/fiber/v2"
	"github.com/gomodule/redigo/redis"
	"github.com/google/uuid"
)

type videoController struct {
	videoRepo model.VideoRepository
	userRepo  model.UserRepository
	groupRepo model.GroupRepository
	validator *validator.Validate
	modelName string
}

func NewVideoController(vr model.VideoRepository, ur model.UserRepository, gr model.GroupRepository) videoController {
	return videoController{
		videoRepo: vr,
		userRepo:  ur,
		groupRepo: gr,
		validator: validator.New(validator.WithRequiredStructEnabled()),
		modelName: model.VideosTableName,
	}
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
	if err := vc.videoRepo.InsertOne(c.Context(), videoData); err != nil {
		return response.ErrCreateRecordsFailed(vc.modelName, err)
	}

	if err := c.SaveFile(video, videoData.Source); err != nil {
		return response.ErrCustomResponse(http.StatusInternalServerError, "failed to save video file", err)
	}

	go func() {
		go func() {
			cmd := exec.Command("python3", "-m", "celery", "-A", "tools.worker", "worker")
			logging.Log.Debugf("command: %v", cmd.String())
			if err := cmd.Run(); err != nil {
				logging.Log.Errorf("failed to run celery worker: %v", err)
				return
			}
		}()

		// create redis connection pool
		redisPool := &redis.Pool{
			MaxIdle:     3,                 // maximum number of idle connections in the pool
			MaxActive:   0,                 // maximum number of connections alloca\ted by the pool at a given time
			IdleTimeout: 240 * time.Second, // close connections after remaining idle for this duration
			Dial: func() (redis.Conn, error) {
				c, err := redis.DialURL("redis://redis:6379/0")
				if err != nil {
					return nil, err
				}
				return c, err
			},
			TestOnBorrow: func(c redis.Conn, t time.Time) error {
				_, err := c.Do("PING")
				return err
			},
		}
		defer redisPool.Close()

		// initialize celery client
		cli, _ := gocelery.NewCeleryClient(
			gocelery.NewRedisBroker(redisPool),
			&gocelery.RedisCeleryBackend{Pool: redisPool},
			1,
		)

		// prepare arguments
		taskName := "tools.worker.add"
		argA := rand.Intn(10)
		argB := rand.Intn(10)

		// run task
		asyncResult, err := cli.Delay(taskName, argA, argB)
		if err != nil {
			panic(err)
		}

		// get results from backend with timeout
		res, err := asyncResult.Get(10 * time.Second)
		if err != nil {
			panic(err)
		}

		logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))
	}()

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

	if err := vc.videoRepo.InsertMany(c.Context(), videosData); err != nil {
		return response.ErrCreateRecordsFailed(vc.modelName, err)
	}

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
