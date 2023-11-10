package service

import (
	"context"
	"encoding/json"
	"lct/internal/logging"
	"lct/internal/model"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"time"

	"github.com/gocelery/gocelery"
)

/*
{"cadrs":[{"fileName":["../static/processed/frames/11/73.jpg","../static/processed/frames/11/74.jpg","../static/processed/frames/11/75.jpg","../static/processed/frames/11/81.jpg","../static/processed/frames/11/82.jpg","../static/processed/frames/11/83.jpg","../static/processed/frames/11/84.jpg","../static/processed/frames/11/85.jpg","../static/processed/frames/11/86.jpg","../static/processed/frames/11/87.jpg","../static/processed/frames/11/88.jpg"],"videoId":11,"timeCode":17.6,"timeCodeMl":3.52,"detectedClassId":1}],"humans":[]}
*/

type MlResult struct {
	Cadrs           []model.MlFrameCreate `json:"cadrs"`
	Humans          []model.MlFrameCreate `json:"humans"`
	ProcessedSource string                `json:"processedSource"`
}

func ProcessVideoFrames(videoId int, videoSource string) {
	cli, _ := gocelery.NewCeleryClient(
		gocelery.NewRedisBroker(redisPool),
		&gocelery.RedisCeleryBackend{Pool: redisPool},
		1,
	)

	taskName := "worker.get_frames"

	asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	if err != nil {
		logging.Log.Errorf("failed to run the task: %s", err)
		return
	}

	res, err := asyncResult.Get(1 * time.Hour)
	if err != nil {
		logging.Log.Errorf("failed to get task result: %s", err)
		return
	}

	logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))
}

func ProcessVideoMl(videoId int, videoSource, fileName string, videoRepo model.VideoRepository, mlFrameRepo model.MlFrameRepository) {
	cli, _ := gocelery.NewCeleryClient(
		gocelery.NewRedisBroker(redisPool),
		&gocelery.RedisCeleryBackend{Pool: redisPool},
		1,
	)

	taskName := "worker.process_video"

	asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	if err != nil {
		logging.Log.Errorf("failed to run the task: %s", err)
		return
	}

	res, err := asyncResult.Get(1 * time.Hour)
	if err != nil {
		logging.Log.Errorf("failed to get task result: %s", err)
		return
	}

	logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))

	var resp MlResult
	if err := json.Unmarshal([]byte(res.(string)), &resp); err != nil {
		logging.Log.Errorf("failed to unmarshal ml result: %s", err)
		return
	}

	c := context.Background()
	if len(resp.Cadrs) != 0 {
		logging.Log.Debug("inserting cadrs ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Cadrs); err != nil {
			logging.Log.Errorf("failed to insert cadrs ml frames: %s", err)
			return
		}
	}
	if len(resp.Humans) != 0 {
		logging.Log.Debug("inserting humans ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Humans); err != nil {
			logging.Log.Errorf("failed to insert humans ml frames: %s", err)
			return
		}
	}

	path := "static/processed/videos/" + resp.ProcessedSource
	fileNameAvi := strings.Replace(fileName, ".mp4", ".avi", 1)
	if _, err := os.Stat(path + "/" + fileNameAvi); os.IsNotExist(err) {
		logging.Log.Debugf("file %s does not exist", fileNameAvi)

		if err := videoRepo.SetCompleted(c, videoId, path+"/"+fileName); err != nil {
			logging.Log.Errorf("failed to set video status as processed: %s", err)
			return
		}

		return
	}

	// ffmpeg -i file.avi -c:v libx264 -pix_fmt yuv420p file.mp4
	cmd := exec.Command("ffmpeg", "-i", path+"/"+fileNameAvi, "-c:v", "libx264", "-pix_fmt", "yuv420p", path+"/"+fileName)
	if err := cmd.Run(); err != nil {
		logging.Log.Errorf("failed to convert video to mp4: %s", err)
		return
	}

	cmd = exec.Command("rm", path+fileNameAvi)
	if err := cmd.Run(); err != nil {
		logging.Log.Errorf("failed to remove .avi video: %s", err)
		return
	}

	if err := videoRepo.SetCompleted(c, videoId, path+"/"+fileNameAvi); err != nil {
		logging.Log.Errorf("failed to set video status as processed: %s", err)
		return
	}
}
