package model

import (
	"context"
	"time"
)

var (
	GroupActionAdd    = "add"
	GroupActionRemove = "remove"
	GroupsTableName   = "groups"
)

type Group struct {
	Id        int       `json:"id"`        // serial, id 0 is for default group
	Title     string    `json:"title"`     // unique
	CreatedAt time.Time `json:"createdAt"` // default = current timestamp
	UpdatedAt time.Time `json:"updatedAt"` // default = current timestamp
}

type GroupCreate struct {
	Title string `json:"title" validate:"required"`
}

type GroupRepository interface {
	InsertOne(c context.Context, groupData GroupCreate) error
	// FindOne(c context.Context, title string) (Group, error)
	FindMany(c context.Context, offset, limit int) ([]Group, error)
	// UpdateOne(c context.Context, groupData Group) error
	DeleteOne(c context.Context, groupId int) error
}
