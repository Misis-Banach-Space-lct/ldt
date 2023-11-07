package model

import (
	"context"
	"time"
)

var CamerasTableName = "cameras"

type Camera struct {
	Id        int       `json:"id"`    // serial
	Title     string    `json:"title"` // unique
	Url       string    `json:"-"`
	CreatedAt time.Time `json:"createdAt"` // default = current timestamp
	UpdatedAt time.Time `json:"updatedAt"` // default = current timestamp
}

type CameraCreate struct {
	Title   string `json:"title" validate:"required"`
	Url     string `json:"url" validate:"required"`
	GroupId int    `json:"groupId" validate:"gte=0"`
}

type CameraGroupUpdate struct {
	Action   string `json:"action" validate:"required,oneof=add remove"`
	CameraId int    `json:"cameraId" validate:"required,gt=0"`
	GroupId  int    `json:"groupId" validate:"required,gte=0"`
}

type CameraRepository interface {
	InsertOne(c context.Context, cameraData CameraCreate) error
	InsertMany(c context.Context, camerasData []CameraCreate) error
	FindOne(c context.Context, filter string, value any) (Camera, error)
	FindMany(c context.Context, contentType string) ([]Camera, error)
	DeleteOne(c context.Context, cameraId int) error // deletes camera source and all related frames
	AddToGroup(c context.Context, cameraId, groupId int) error
	RemoveFromGroup(c context.Context, cameraId, groupId int) error
}
