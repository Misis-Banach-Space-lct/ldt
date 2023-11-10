package repository

import (
	"context"
	"lct/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type learnFramePgRepository struct {
	db *pgxpool.Pool
}

func NewLearnFramePgRepository(db *pgxpool.Pool) (model.LearnFrameRepository, error) {
	_, err := db.Exec(context.Background(), `
		create table if not exists `+model.LearnFrameTableName+` (
			id serial primary key,
			width int not null,
			height int not null,
			x int not null,
			y int not null,
			classId int not null,
			videoId int not null,
			userId int not null,
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp,
			foreign key (userId) references `+model.UsersTableName+`(id),
			foreign key (videoId) references `+model.VideosTableName+`(id)
	);`)
	if err != nil {
		return nil, err
	}

	return &learnFramePgRepository{db: db}, nil
}

func (lr *learnFramePgRepository) InsertOne(c context.Context, frameData model.LearnFrameCreate, userId int) error {
	_, err := lr.db.Exec(c, `
		insert into `+model.LearnFrameTableName+`(width, height, x, y, classId, videoId, userId)
		values ($1, $2, $3, $4, $5, $6)
	`, frameData.Width, frameData.Height, frameData.X, frameData.Y, frameData.ClassId, frameData.VideoId, userId)
	return err
}
