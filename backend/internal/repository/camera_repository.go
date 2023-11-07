package repository

import (
	"context"
	"lct/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type cameraPgRepository struct {
	db *pgxpool.Pool
}

func NewCameraPgRepository(db *pgxpool.Pool) (model.CameraRepository, error) {
	_, err := db.Exec(context.Background(), `
		create table if not exists `+model.CamerasTableName+`(
			id serial primary key,
			title text not null unique,
			url text not null,
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp
		)
	`)
	if err != nil {
		return nil, err
	}

	return &cameraPgRepository{
		db: db,
	}, nil
}

func (cr *cameraPgRepository) InsertOne(c context.Context, cameraData model.CameraCreate) error {
	var cameraId int
	err := cr.db.QueryRow(c, `
		insert into `+model.CamerasTableName+`(title, url)
		values($1, $2)
		returning "id"
	`, cameraData.Title, cameraData.Url).Scan(&cameraId)
	if err != nil {
		return err
	}

	_, err = cr.db.Exec(c, `
		insert into `+model.CamerasTableName+"_"+model.GroupsTableName+`
		values($1, $2)
	`, cameraId, cameraData.GroupId)
	return err
}

func (cr *cameraPgRepository) InsertMany(c context.Context, camerasData []model.CameraCreate) error {
	return nil
}

func (cr *cameraPgRepository) FindOne(c context.Context, filter string, value any) (model.Camera, error) {
	var video model.Camera
	return video, nil
}

func (cr *cameraPgRepository) FindMany(c context.Context, contentType string) ([]model.Camera, error) {
	var videos []model.Camera
	return videos, nil
}

func (cr *cameraPgRepository) DeleteOne(c context.Context, cameraId int) error {
	return nil
}

func (cr *cameraPgRepository) AddToGroup(c context.Context, cameraId, groupId int) error {
	return nil
}

func (cr *cameraPgRepository) RemoveFromGroup(c context.Context, cameraId, groupId int) error {
	return nil
}
