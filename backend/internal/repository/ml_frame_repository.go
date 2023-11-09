package repository

import (
	"context"
	"lct/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type framePgRepository struct {
	db *pgxpool.Pool
}

func NewFramePgRepository(db *pgxpool.Pool) (model.MlFrameRepository, error) {
	return &framePgRepository{
		db: db,
	}, nil
}

func (fr *framePgRepository) InsertMany(c context.Context, framesData []model.MlFrameCreate) error {
	return nil
}

func (fr *framePgRepository) FindOne(c context.Context, filter string, value any) (model.MlFrame, error) {
	var frame model.MlFrame
	return frame, nil
}

func (fr *framePgRepository) FindMany(c context.Context, filter string, value any) ([]model.MlFrame, error) {
	var frames []model.MlFrame
	return frames, nil
}
