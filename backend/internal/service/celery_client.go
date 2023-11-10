package service

import (
	"context"
	"fmt"
	"lct/internal/logging"
	"lct/internal/model"
	"os/exec"
	"reflect"
	"strings"
	"time"

	"github.com/gocelery/gocelery"
)

func ProcessVideoFrames(videoId int, videoSource string) {
	// initialize celery client
	cli, _ := gocelery.NewCeleryClient(
		gocelery.NewRedisBroker(redisPool),
		&gocelery.RedisCeleryBackend{Pool: redisPool},
		1,
	)

	// prepare arguments
	taskName := "worker.get_frames"

	// run task
	asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	if err != nil {
		logging.Log.Errorf("failed to run the task: %s", err)
		return
	}

	// get results from backend with timeout
	res, err := asyncResult.Get(40 * time.Second)
	if err != nil {
		logging.Log.Errorf("failed to get task result: %s", err)
		return
	}

	logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))
}

func ProcessVideoMl(c context.Context, videoId int, videoSource, fileName string, videoRepo model.VideoRepository) {
	// initialize celery client
	cli, _ := gocelery.NewCeleryClient(
		gocelery.NewRedisBroker(redisPool),
		&gocelery.RedisCeleryBackend{Pool: redisPool},
		1,
	)

	// prepare arguments
	taskName := "worker.process_video"

	// run task
	asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	if err != nil {
		logging.Log.Errorf("failed to run the task: %s", err)
		return
	}

	// get results from backend with timeout
	res, err := asyncResult.Get(1 * time.Hour)
	if err != nil {
		logging.Log.Errorf("failed to get task result: %s", err)
		return
	}

	logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))

	if err := videoRepo.SetCompleted(c, videoId, fileName); err != nil {
		logging.Log.Errorf("failed to set video status as processed: %s", err)
		return
	}

	fileNameAvi := strings.Replace(fileName, ".mp4", ".avi", 1)
	path := fmt.Sprintf("static/processed/videos/predict%d/", videoId)
	// ffmpeg -i file.avi -c:v libx264 -pix_fmt yuv420p file.mp4
	cmd := exec.Command("ffmpeg", "-i", path+fileNameAvi, "-c:v", "libx264", "-pix_fmt", "yuv420p", path+fileName)
	if err := cmd.Run(); err != nil {
		logging.Log.Errorf("failed to convert video to mp4: %s", err)
		return
	}

	cmd = exec.Command("rm", path+fileNameAvi)
	if err := cmd.Run(); err != nil {
		logging.Log.Errorf("failed to remove .avi video: %s", err)
		return
	}
}
