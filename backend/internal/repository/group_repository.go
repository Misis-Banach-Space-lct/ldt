package repository

import (
	"context"
	"errors"
	"fmt"
	"lct/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type groupPgRepository struct {
	db *pgxpool.Pool
}

func NewGroupPgRepository(db *pgxpool.Pool) (model.GroupRepository, error) {
	ctx := context.Background()
	tx, err := db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		create table if not exists `+model.GroupsTableName+`(
			id serial primary key,
			title text not null unique,
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp
		);
	`)
	if err != nil {
		return nil, err
	}

	// TODO: make separate db loader
	var groupId int
	err = tx.QueryRow(ctx, `
		select id from `+model.GroupsTableName+` where id = 0;
	`).Scan(&groupId)
	if errors.Is(err, pgx.ErrNoRows) {
		err = tx.QueryRow(ctx, `
			insert into `+model.GroupsTableName+`(id, title) 
			values ($1, $2)
			returning id;
		`, 0, "default").Scan(&groupId)
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &groupPgRepository{
		db: db,
	}, nil
}

func (gr *groupPgRepository) InsertOne(c context.Context, groupData model.GroupCreate) error {
	_, err := gr.db.Exec(c, `
		insert into `+model.GroupsTableName+`(title)
		values ($1)
	`, groupData.Title)
	return err
}

func (gr *groupPgRepository) FindMany(c context.Context, offset, limit int) ([]model.Group, error) {
	var groups []model.Group

	sql := `select * from ` + model.GroupsTableName + ` order by title`
	if limit > 0 {
		sql += fmt.Sprintf(` offset %d limit %d`, offset, limit)
	}

	rows, err := gr.db.Query(c, sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var group model.Group
		if err := rows.Scan(&group.Id, &group.Title, &group.CreatedAt, &group.UpdatedAt); err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}

	return groups, nil
}

func (gr *groupPgRepository) DeleteOne(c context.Context, groupId int) error {
	tx, err := gr.db.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	_, err = tx.Exec(c, `
		delete from `+model.UsersTableName+"_"+model.GroupsTableName+`
		where groupId = $1
	`, groupId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		delete from `+model.CamerasTableName+"_"+model.GroupsTableName+`
		where groupId = $1
	`, groupId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		delete from `+model.VideosTableName+"_"+model.GroupsTableName+`
		where groupId = $1
	`, groupId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		delete from `+model.GroupsTableName+`
		where id = $1
	`, groupId)
	if err != nil {
		return err
	}

	return tx.Commit(c)
}
