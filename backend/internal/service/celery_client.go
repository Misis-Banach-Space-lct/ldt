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
	"github.com/gomodule/redigo/redis"
)

func ProcessVideoFrames(videoId int, videoSource string) {
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
	// convert video in static/processed/videos/predict{videoId}/{fileNameAvi}.avi to .mp4 using ffmpeg and os/exec
	cmd := exec.Command("ffmpeg", "-i", path+fileNameAvi, "-vcodec", "copy", "-acodec", "copy", path+fileName)
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
