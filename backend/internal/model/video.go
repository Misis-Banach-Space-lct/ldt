package model

import (
	"context"
	"time"
)

var (
	VideosTableName       = "videos"
	VideoStatusProcessing = "processing"
	VideoStatusCompleted  = "completed"
)

type Video struct {
	Id              int       `json:"id"`    // serial
	Title           string    `json:"title"` // unique
	Source          string    `json:"source"`
	ProcessedSource string    `json:"-"`
	Status          string    `json:"status"`    // default = "processing"
	CreatedAt       time.Time `json:"createdAt"` // default = current timestamp
	UpdatedAt       time.Time `json:"updatedAt"` // default = current timestamp
}

// used in controller only, user doesnt send it
type VideoCreate struct {
	Title   string `json:"title"`
	Source  string `json:"source"`
	GroupId int    `json:"groupId"`
}

type VideoUpdateGroup struct {
	Action  string `json:"action" validate:"required,oneof=add remove"`
	VideoId int    `json:"videoId" validate:"required,gt=1"`
	GroupId int    `json:"groupId" validate:"gte=0"`
}

type VideoRepository interface {
	InsertOne(c context.Context, videoData VideoCreate) error
	InsertMany(c context.Context, videosData []VideoCreate) error
	FindOne(c context.Context, filter string, value any, userGroupIds []int) (Video, error)
	FindMany(c context.Context, filter string, value any, offset, limit int, userGroupIds []int) ([]Video, error)
	DeleteOne(c context.Context, videoId int) error
	AddToGroup(c context.Context, videoId, groupId int) error
	RemoveFromGroup(c context.Context, videoId, groupId int) error
}
