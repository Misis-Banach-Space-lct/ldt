package repository

import (
	"context"
	"lct/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type framePgRepository struct {
	db *pgxpool.Pool
}

func NewFramePgRepository(db *pgxpool.Pool) (model.FrameRepository, error) {
	return &framePgRepository{
		db: db,
	}, nil
}

func (fr *framePgRepository) InsertMany(c context.Context, framesData []model.FrameCreate) error {
	return nil
}

func (fr *framePgRepository) FindOne(c context.Context, filter string, value any) (model.Frame, error) {
	var frame model.Frame
	return frame, nil
}

func (fr *framePgRepository) FindMany(c context.Context, filter string, value any) ([]model.Frame, error) {
	var frames []model.Frame
	return frames, nil
}
