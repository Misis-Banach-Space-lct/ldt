package repository

import (
	"context"
	"errors"
	"fmt"
	"lct/internal/logging"
	"lct/internal/model"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type cameraPgRepository struct {
	db *pgxpool.Pool
}

func NewCameraPgRepository(db *pgxpool.Pool) (model.CameraRepository, error) {
	ctx := context.Background()
	tx, err := db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		create table if not exists `+model.CamerasTableName+`(
			id serial primary key,
			connUuid text not null unique,
			url text not null,
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp
		)
	`)
	if err != nil {
		return nil, err
	}

	var cameraId int
	err = tx.QueryRow(ctx, `
		select id from `+model.CamerasTableName+` where id = 1
	`).Scan(&cameraId)
	if errors.Is(err, pgx.ErrNoRows) {
		_, err = tx.Exec(ctx, `
			insert into `+model.CamerasTableName+`(connUuid, url)
			values('27aec28e-6181-4753-9acd-0456a75f0289', 'rtsp://admin:A1234567@188.170.176.190:8028/Streaming/Channels/101?transportmode=unicast&profile=Profile_1')
		`)

		_, err = tx.Exec(ctx, `
			insert into `+model.CamerasTableName+`_`+model.GroupsTableName+`
			values(1, 0)
		`)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &cameraPgRepository{
		db: db,
	}, nil
}

func (cr *cameraPgRepository) InsertOne(c context.Context, cameraData model.CameraCreate) (int, error) {
	tx, err := cr.db.Begin(c)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(c)

	var cameraId int
	err = tx.QueryRow(c, `
		insert into `+model.CamerasTableName+`(connUuid, url)
		values($1, $2)
		returning "id"
	`, cameraData.Uuid, cameraData.Url).Scan(&cameraId)
	if err != nil {
		return cameraId, err
	}

	_, err = tx.Exec(c, `
		insert into `+model.CamerasTableName+"_"+model.GroupsTableName+`
		values($1, 0)
	`, cameraId)
	if err != nil {
		return cameraId, err
	}

	if cameraData.GroupId != 0 {
		_, err = tx.Exec(c, `
		insert into `+model.CamerasTableName+"_"+model.GroupsTableName+`
		values($1, $2)
	`, cameraId, cameraData.GroupId)
		if err != nil {
			return cameraId, err
		}
	}

	return cameraId, tx.Commit(c)
}

func (cr *cameraPgRepository) InsertMany(c context.Context, camerasData []model.CameraCreate) ([]int, error) {
	var cameraIds []int

	tx, err := cr.db.Begin(c)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(c)

	for _, camera := range camerasData {
		innerTx, err := tx.Begin(c)
		if err != nil {
			return cameraIds, err
		}
		defer innerTx.Rollback(c)

		var cameraId int
		err = innerTx.QueryRow(c, `
			insert into `+model.CamerasTableName+`(connUuid, url)
			values($1, $2)
			returning id
		`, camera.Uuid, camera.Url).Scan(&cameraId)
		if err != nil {
			return cameraIds, err
		}

		cameraIds = append(cameraIds, cameraId)

		_, err = innerTx.Exec(c, `
			insert into `+model.CamerasTableName+"_"+model.GroupsTableName+`
			values($1, 0)
		`, cameraId)
		if err != nil {
			return cameraIds, err
		}

		if camera.GroupId != 0 {
			_, err = innerTx.Exec(c, `
				insert into `+model.CamerasTableName+"_"+model.GroupsTableName+`
				values($1, $2)
			`, cameraId, camera.GroupId)
			if err != nil {
				return cameraIds, err
			}
		}

		err = innerTx.Commit(c)
		if err != nil {
			return cameraIds, err
		}
	}

	return cameraIds, tx.Commit(c)
}

func (cr *cameraPgRepository) FindOne(c context.Context, filter string, value any, userGroupIds []int) (model.Camera, error) {
	var camera model.Camera

	sql := `select * from ` + model.CamerasTableName + ` where `
	if filter != "" {
		sql += fmt.Sprintf("%s = '%s' and ", filter, value)
	}
	sql += `id in (select cameraId from ` + model.CamerasTableName + "_" + model.GroupsTableName + ` where groupId = any($1))`

	err := cr.db.QueryRow(c, sql, userGroupIds).Scan(&camera.Id, &camera.Uuid, &camera.Url, &camera.CreatedAt, &camera.UpdatedAt)
	if err != nil {
		return camera, err
	}

	groupIds, err := cr.GetGroupIds(c, camera.Id)
	if err != nil {
		return camera, err
	}

	camera.GroupIds = groupIds

	return camera, nil
}

func (cr *cameraPgRepository) FindMany(c context.Context, filter string, value any, userGroupIds []int) ([]model.Camera, error) {
	var cameras []model.Camera

	sql := `select * from ` + model.CamerasTableName + ` where `
	if filter != "" {
		if filter == "groupId" {
			id, err := strconv.Atoi(value.(string))
			if err != nil {
				return nil, err
			}
			flag := false
			for _, groupId := range userGroupIds {
				if groupId == id {
					flag = true
					break
				}
			}
			if !flag {
				logging.Log.Debugf("groupId %v is not permitted, available groups: %+v", value, userGroupIds)
				return nil, nil
			}
			userGroupIds = []int{id}
		} else {
			sql += fmt.Sprintf("%s = '%v' and ", filter, value)
		}
	}
	sql += `
		id in (select cameraId from ` + model.CamerasTableName + "_" + model.GroupsTableName + ` where groupId = any($1))
	`

	rows, err := cr.db.Query(c, sql, userGroupIds)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var camera model.Camera
		if err := rows.Scan(&camera.Id, &camera.Uuid, &camera.Url, &camera.CreatedAt, &camera.UpdatedAt); err != nil {
			return nil, err
		}

		groupIds, err := cr.GetGroupIds(c, camera.Id)
		if err != nil {
			return nil, err
		}

		camera.GroupIds = groupIds
		cameras = append(cameras, camera)
	}

	return cameras, nil
}

func (cr *cameraPgRepository) DeleteOne(c context.Context, cameraId int) error {
	tx, err := cr.db.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	_, err = tx.Exec(c, `
		delete from `+model.CamerasTableName+"_"+model.GroupsTableName+`
		where cameraId = $1
	`, cameraId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		delete from `+model.CamerasTableName+`
		where id = $1
	`, cameraId)
	if err != nil {
		return err
	}

	return tx.Commit(c)
}

func (cr *cameraPgRepository) AddToGroup(c context.Context, cameraId, groupId int) error {
	_, err := cr.db.Exec(c, `
		insert into `+model.CamerasTableName+"_"+model.GroupsTableName+`
		values ($1, $2)
	`, cameraId, groupId)
	return err
}

func (cr *cameraPgRepository) RemoveFromGroup(c context.Context, cameraId, groupId int) error {
	_, err := cr.db.Exec(c, `
		delete from `+model.CamerasTableName+"_"+model.GroupsTableName+`
		where cameraId = $1 and groupId = $2
	`, cameraId, groupId)
	return err
}

func (cr *cameraPgRepository) GetGroupIds(c context.Context, cameraId int) ([]int, error) {
	var groupIds []int

	rows, err := cr.db.Query(c, `
		select groupId from `+model.CamerasTableName+"_"+model.GroupsTableName+`
		where cameraId = $1
	`, cameraId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var groupId int
		if err := rows.Scan(&groupId); err != nil {
			return nil, err
		}

		groupIds = append(groupIds, groupId)
	}

	return groupIds, nil
}
