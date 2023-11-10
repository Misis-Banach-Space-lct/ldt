package repository

import (
	"context"
	"fmt"
	"lct/internal/logging"
	"lct/internal/model"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
)

type videoPgRepository struct {
	db *pgxpool.Pool
}

func NewVideoPgRepository(db *pgxpool.Pool) (model.VideoRepository, error) {
	ctx := context.Background()

	_, err := db.Exec(ctx, `
		create table if not exists `+model.VideosTableName+`(
			id serial primary key,
			title text not null unique,
			source text not null,
			processedSource text not null default '',
			status text default 'processing',
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp
		);
	`)
	if err != nil {
		return nil, err
	}

	return &videoPgRepository{
		db: db,
	}, nil
}

func (vr *videoPgRepository) InsertOne(c context.Context, videoData model.VideoCreate) (int, error) {
	tx, err := vr.db.Begin(c)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(c)

	var videoId int
	err = tx.QueryRow(c, `
		insert into `+model.VideosTableName+`(title, source)
		values($1, $2)
		returning id
	`, videoData.Title, videoData.Source).Scan(&videoId)
	if err != nil {
		return 0, err
	}

	_, err = tx.Exec(c, `
		insert into `+model.VideosTableName+"_"+model.GroupsTableName+`
		values($1, 0)
	`, videoId)
	if err != nil {
		return 0, err
	}

	if videoData.GroupId != 0 {
		_, err = tx.Exec(c, `
			insert into `+model.VideosTableName+"_"+model.GroupsTableName+`
			values($1, $2)
		`, videoId, videoData.GroupId)
		if err != nil {
			return 0, err
		}
	}

	return videoId, tx.Commit(c)
}

func (vr *videoPgRepository) InsertMany(c context.Context, videoData []model.VideoCreate) ([]int, error) {
	var videoIds []int

	tx, err := vr.db.Begin(c)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(c)

	for _, video := range videoData {
		innerTx, err := tx.Begin(c)
		if err != nil {
			return videoIds, err
		}
		defer innerTx.Rollback(c)

		var videoId int
		err = innerTx.QueryRow(c, `
			insert into `+model.VideosTableName+`(title, source)
			values($1, $2)
			returning id
		`, video.Title, video.Source).Scan(&videoId)
		if err != nil {
			return videoIds, err
		}

		videoIds = append(videoIds, videoId)

		_, err = innerTx.Exec(c, `
			insert into `+model.VideosTableName+"_"+model.GroupsTableName+`
			values($1, 0)
		`, videoId)
		if err != nil {
			return videoIds, err
		}

		if video.GroupId != 0 {
			_, err = innerTx.Exec(c, `
				insert into `+model.VideosTableName+"_"+model.GroupsTableName+`
				values($1, $2)
			`, videoId, video.GroupId)
			if err != nil {
				return videoIds, err
			}
		}

		err = innerTx.Commit(c)
		if err != nil {
			return videoIds, err
		}
	}

	return videoIds, tx.Commit(c)
}

func (vr *videoPgRepository) FindOne(c context.Context, filter string, value any, userGroupIds []int) (model.Video, error) {
	var video model.Video

	sql := `select * from ` + model.VideosTableName + ` where `
	if filter != "" {
		sql += fmt.Sprintf("%s = '%v' and ", filter, value)
	}
	sql += `id in (select videoId from ` + model.VideosTableName + "_" + model.GroupsTableName + ` where groupId = any($1))`

	err := vr.db.QueryRow(c, sql, userGroupIds).Scan(&video.Id, &video.Title, &video.Source, &video.ProcessedSource, &video.Status, &video.CreatedAt, &video.UpdatedAt)
	if err != nil {
		return video, err
	}

	groupIds, err := vr.GetGroupIds(c, video.Id)
	if err != nil {
		return video, err
	}

	video.GroupIds = groupIds

	return video, nil
}

func (vr *videoPgRepository) FindMany(c context.Context, filter string, value any, offset, limit int, userGroupIds []int) ([]model.Video, error) {
	var videos []model.Video

	sql := `select * from ` + model.VideosTableName + ` where `
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
		id in (select videoId from ` + model.VideosTableName + "_" + model.GroupsTableName + ` where groupId = any($1))
		order by id desc offset $2 limit $3
	`

	rows, err := vr.db.Query(c, sql, userGroupIds, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var video model.Video
		if err := rows.Scan(&video.Id, &video.Title, &video.Source, &video.ProcessedSource, &video.Status, &video.CreatedAt, &video.UpdatedAt); err != nil {
			return nil, err
		}

		groupIds, err := vr.GetGroupIds(c, video.Id)
		if err != nil {
			return nil, err
		}

		video.GroupIds = groupIds
		videos = append(videos, video)
	}

	return videos, nil
}

func (vr *videoPgRepository) DeleteOne(c context.Context, videoId int) error {
	tx, err := vr.db.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	_, err = tx.Exec(c, `
		delete from `+model.VideosTableName+"_"+model.GroupsTableName+`
		where videoId = $1
	`, videoId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		delete from `+model.VideosTableName+`
		where id = $1
	`, videoId)
	if err != nil {
		return err
	}

	return tx.Commit(c)
}

func (vr *videoPgRepository) AddToGroup(c context.Context, videoId, groupId int) error {
	_, err := vr.db.Exec(c, `
		insert into `+model.VideosTableName+"_"+model.GroupsTableName+`
		values ($1, $2)
	`, videoId, groupId)
	return err
}

func (vr *videoPgRepository) RemoveFromGroup(c context.Context, videoId, groupId int) error {
	_, err := vr.db.Exec(c, `
		delete from `+model.VideosTableName+"_"+model.GroupsTableName+`
		where videoId = $1 and groupId = $2
	`, videoId, groupId)
	return err
}

func (vr *videoPgRepository) GetGroupIds(c context.Context, videoId int) ([]int, error) {
	var groupIds []int

	rows, err := vr.db.Query(c, `
		select groupId from `+model.VideosTableName+"_"+model.GroupsTableName+`
		where videoId = $1
	`, videoId)
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

func (vr *videoPgRepository) SetCompleted(c context.Context, videoId int, fileName string) error {
	_, err := vr.db.Query(c, `
		update `+model.VideosTableName+`
		set status = 'completed'
		where id = $1
	`, videoId)

	var processedSource string
	if videoId == 1 {
		processedSource = fmt.Sprintf("static/processed/videos/predict/%s", fileName)
	} else {
		processedSource = fmt.Sprintf("static/processed/videos/predict%d/%s", videoId, fileName)
	}

	_, err = vr.db.Query(c, `
		update `+model.VideosTableName+`
		set processedSource = $1
		where id = $2
	`, processedSource, videoId)
	return err
}
