package repository

import (
	"context"
	"lct/internal/model"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type mlFramePgRepository struct {
	db *pgxpool.Pool
}

func NewMlFramePgRepository(db *pgxpool.Pool) (model.MlFrameRepository, error) {
	_, err := db.Exec(context.Background(), `
		create table if not exists `+model.MlFramesTableName+`(
			id serial primary key,
			videoId int,
			fileName text,
			timeCode float,
			timeCodeMl float,
			detectedClassId int,
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp,
			foreign key (videoId) references `+model.VideosTableName+`(id)
		);
	`)
	if err != nil {
		return nil, err
	}

	return &mlFramePgRepository{
		db: db,
	}, nil
}

func (mr *mlFramePgRepository) InsertMany(c context.Context, framesData []model.MlFrameCreate) error {
	tx, err := mr.db.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	for _, frame := range framesData {
		paths := []string{frame.FileName[0]}
		if len(frame.FileName) != 1 {
			paths = []string{frame.FileName[0], frame.FileName[len(frame.FileName)-1], frame.FileName[len(frame.FileName)/2]}
		}
		pathsJoined := strings.Join(paths, ";")

		_, err := tx.Exec(c, `
			insert into `+model.MlFramesTableName+`(
				videoId, fileName, timeCode, timeCodeMl, detectedClassId
			)
			values ($1, $2, $3, $4, $5)
		`, frame.VideoId, pathsJoined, frame.TimeCode, frame.TimeCodeMl, frame.DetectedClassId)
		if err != nil {
			return err
		}
	}

	return tx.Commit(c)
}

func (mr *mlFramePgRepository) FindMany(c context.Context, videoId int) ([]model.MlFrame, error) {
	var frames []model.MlFrame

	rows, err := mr.db.Query(c, `
		select * from `+model.MlFramesTableName+`
		where videoId = $1
	`, videoId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var frame model.MlFrame
		if err := rows.Scan(&frame.Id, &frame.VideoId, &frame.FileName, &frame.TimeCode, &frame.TimeCodeMl, &frame.DetectedClassId, &frame.CreatedAt, &frame.UpdatedAt); err != nil {
			return nil, err
		}

		frames = append(frames, frame)
	}

	return frames, nil
}
