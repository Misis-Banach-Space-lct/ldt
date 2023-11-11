package model

import (
	"context"
	"time"
)

var MlFramesTableName = "ml_frames"

type MlFrame struct {
	Id              int       `json:"id"`      // serial
	VideoId         int       `json:"videoId"` // fk
	FileName        string    `json:"fileName"`
	TimeCode        float64   `json:"timeCode"`
	TimeCodeMl      float64   `json:"timeCodeMl"`
	DetectedClassId int       `json:"detectedClassId"`
	CreatedAt       time.Time `json:"createdAt"` // default = current timestamp
	UpdatedAt       time.Time `json:"updatedAt"` // default = current timestamp
}

type MlFrameCreate struct {
	FileName        []string `json:"fileName"`
	VideoId         int      `json:"videoId"`
	TimeCode        float64  `json:"timeCode"`
	TimeCodeMl      float64  `json:"timeCodeMl"`
	DetectedClassId int      `json:"detectedClassId"`
}

type MlFrameRepository interface {
	InsertMany(c context.Context, framesData []MlFrameCreate) error
	FindMany(c context.Context, videoId int) ([]MlFrame, error)
}
