package model

import (
	"context"
	"time"
)

var (
	RoleAdmin      = "admin"
	RoleViewer     = "viewer"
	UsersTableName = "users"
)

type User struct {
	Id        int       `json:"id"`    // serial
	Username  string    `json:"-"`     // not null, unique
	Password  string    `json:"-"`     // not null
	Role      string    `json:"role"`  // admin, viewer
	Email     string    `json:"email"` // not null, unique
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	CreatedAt time.Time `json:"createdAt"` // default = current timestamp
	UpdatedAt time.Time `json:"updatedAt"` // default = current timestamp
}

type UserLogin struct {
	Username string `json:"username" validate:"required" example:"testUser"`
	Password string `json:"password" validate:"required" example:"test123456"`
}

// accessible only for admins
type UserCreate struct {
	Username  string `json:"-"`
	Password  string `json:"-"`
	Role      string `json:"role"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	GroupId   int    `json:"groupId" validate:"gte=0"`
}

type UserGroupUpdate struct {
	Action  string `json:"action" validate:"required,oneof=add remove"`
	UserId  int    `json:"userId" validate:"required,gt=1"`
	GroupId int    `json:"groupId" validate:"gte=0"`
}

type UserRepository interface {
	InsertOne(c context.Context, userData UserCreate) error
	// InsertMany(c context.Context, usersData []UserCreate) error
	FindOne(c context.Context, filter string, value any) (User, error)
	FindMany(c context.Context, filter string, value any, offset, limit int) ([]User, error) // filter "" means any, value nil means any
	// UpdateOne(c context.Context, userData User) error
	DeleteOne(c context.Context, userId int) error
	AddToGroup(c context.Context, userId, groupId int) error
	RemoveFromGroup(c context.Context, userId, groupId int) error
	GetGroups(c context.Context, userId int) ([]int, error)
}
