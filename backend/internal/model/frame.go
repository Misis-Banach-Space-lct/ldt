package model

import "context"

var FramesTableName = "frames"

type Frame struct {
	Id       int    `json:"id"` // serial
	FileName string `json:"-"`
	VideoId  int    `json:"videoId"` // fk
	TimeCode string `json:"timeCode"`
}

type FrameCreate struct {
	FileName string `json:"fileNmae" validate:"required"`
	VideoId  int    `json:"videoId" validate:"required,gt=0"`
	TimeCode string `json:"timeCode"`
}

type FrameRepository interface {
	// InsertOne(c context.Context, frameData FrameCreate) error
	InsertMany(c context.Context, framesData []FrameCreate) error
	FindOne(c context.Context, filter string, value any) (Frame, error)
	FindMany(c context.Context, filter string, value any) ([]Frame, error)
}
