package service

import (
	"context"
	"lct/internal/logging"
	"lct/internal/model"
	"reflect"
	"time"

	"github.com/gocelery/gocelery"
	"github.com/gomodule/redigo/redis"
)

func ProcessVideo(c context.Context, videoId int, videoSource string, videoRepo model.VideoRepository) {
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

	if err := videoRepo.SetProcessed(c, videoId); err != nil {
		logging.Log.Errorf("failed to set video status as processed: %s", err)
		return
	}
}
