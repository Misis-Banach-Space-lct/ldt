package model

import (
	"context"
	"time"
)

var LearnFrameTableName = "learn_frames"

type LearnFrame struct {
	Id        int       `json:"id"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	X         int       `json:"x"`
	Y         int       `json:"y"`
	ClassId   int       `json:"ClassId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserId    int       `json:"userId"`  // fk
	VideoId   int       `json:"videoId"` // fk
}

type LearnFrameCreate struct {
	Width   int `json:"width" validate:"required"`
	Height  int `json:"height" validate:"required"`
	X       int `json:"x" validate:"required"`
	Y       int `json:"y" validate:"required"`
	ClassId int `json:"ClassId" validate:"required"`
	VideoId int `json:"videoId" validate:"required"` // fk
}

type LearnFrameRepository interface {
	InsertOne(c context.Context, frameData LearnFrameCreate, userId int) error
}
