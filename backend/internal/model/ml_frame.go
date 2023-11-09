package model

import "context"

var FramesTableName = "frames"

type MlFrame struct {
	Id              int    `json:"id"`      // serial
	VideoId         int    `json:"videoId"` // fk
	FileName        string `json:"fileName"`
	TimeCode        string `json:"timeCode"`
	TimeCodeMl      string `json:"timeCodeMl"`
	DetectedClassId int    `json:"detectedClassId"`
}

type MlFrameCreate struct {
	FileName        string `json:"fileName"`
	VideoId         int    `json:"videoId"`
	TimeCode        string `json:"timeCode"`
	TimeCodeMl      string `json:"timeCodeMl"`
	DetectedClassId int    `json:"detectedClassId"`
}

type MlFrameRepository interface {
	// InsertOne(c context.Context, frameData FrameCreate) error
	InsertMany(c context.Context, framesData []MlFrameCreate) error
	FindOne(c context.Context, filter string, value any) (MlFrame, error)
	FindMany(c context.Context, filter string, value any) ([]MlFrame, error)
}
