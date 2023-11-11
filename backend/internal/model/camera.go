package model

import (
	"context"
	"time"
)

var CamerasTableName = "cameras"

type Camera struct {
	Id        int       `json:"id"` // serial
	Uuid      string    `json:"uuid"`
	Url       string    `json:"url"`
	CreatedAt time.Time `json:"createdAt"` // default = current timestamp
	UpdatedAt time.Time `json:"updatedAt"` // default = current timestamp
	GroupIds  []int     `json:"groupIds"`
}

type CameraCreate struct {
	Uuid    string `json:"uuid"`
	Url     string `json:"url"`
	GroupId int    `json:"groupId"`
}

type CameraGroupUpdate struct {
	Action   string `json:"action" validate:"required,oneof=add remove"`
	CameraId int    `json:"cameraId" validate:"required,gt=0"`
	GroupId  int    `json:"groupId" validate:"required,gte=0"`
}

type CameraRepository interface {
	InsertOne(c context.Context, cameraData CameraCreate) (int, error)
	InsertMany(c context.Context, camerasData []CameraCreate) ([]int, error)
	FindOne(c context.Context, filter string, value any, userGroupIds []int) (Camera, error)
	FindMany(c context.Context, filter string, value any, userGroupIds []int) ([]Camera, error)
	DeleteOne(c context.Context, cameraId int) error // deletes camera source and all related frames
	AddToGroup(c context.Context, cameraId, groupId int) error
	RemoveFromGroup(c context.Context, cameraId, groupId int) error
	GetGroupIds(c context.Context, cameraId int) ([]int, error)
}
