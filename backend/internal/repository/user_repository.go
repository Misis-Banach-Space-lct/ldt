package repository

import (
	"context"
	"errors"
	"fmt"
	"lct/internal/logging"
	"lct/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type userPgRepository struct {
	db *pgxpool.Pool
}

func NewUserPgRepository(db *pgxpool.Pool) (model.UserRepository, error) {
	ctx := context.Background()
	tx, err := db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		create table if not exists `+model.UsersTableName+`(
			id serial primary key,
			username text not null unique,
			password text not null,
			role text not null,
			email text not null unique,
			firstName text,
			lastName text,
			createdAt timestamp default current_timestamp,
			updatedAt timestamp default current_timestamp
		);
	`)
	if err != nil {
		return nil, err
	}

	// TODO: make separate db loader
	var userId int
	err = tx.QueryRow(ctx, `
		select id from `+model.UsersTableName+` where id = 0
	`).Scan(&userId)
	if errors.Is(err, pgx.ErrNoRows) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("test123456"), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		err = tx.QueryRow(ctx, `
			insert into `+model.UsersTableName+`(
				id, username, password, role, email, firstName, lastName
			) 
			values (
				$1, $2, $3, $4, $5, $6, $7
			)
			returning id;
		`, 0, "testUser", hashedPassword, "admin", "test@test.com", "Роберт", "Ласурия").Scan(&userId)
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		logging.Log.Errorf("failed to commit transaction: %v", err)
		return nil, err
	}

	return &userPgRepository{
		db: db,
	}, nil
}

func (ur *userPgRepository) InsertOne(c context.Context, userData model.UserCreate) error {
	tx, err := ur.db.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	var userId int
	err = tx.QueryRow(c, `
		insert into `+model.UsersTableName+`(
			username, password, role, email, firstName, lastName
		)
		values (
			$1, $2, $3, $4, $5, $6
		)
		returning id;
	`, userData.Username, userData.Password, userData.Role, userData.Email, userData.FirstName, userData.LastName).Scan(&userId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		insert into `+model.UsersTableName+"_"+model.GroupsTableName+`
		values ($1, 0)
	`, userId)
	if err != nil {
		return err
	}

	if userData.GroupId != 0 {
		_, err = tx.Exec(c, `
			insert into `+model.UsersTableName+"_"+model.GroupsTableName+`
			values ($1, $2)
		`, userId, userData.GroupId)
		if err != nil {
			return err
		}
	}

	return tx.Commit(c)
}

func (ur *userPgRepository) FindOne(c context.Context, filter string, value any) (model.User, error) {
	var user model.User

	sql := `select id, password, role from ` + model.UsersTableName
	if filter != "" {
		sql += fmt.Sprintf(" where %s = $1", filter)
	}

	err := ur.db.QueryRow(c, sql, value).Scan(&user.Id, &user.Password, &user.Role)
	return user, err
}

func (ur *userPgRepository) FindMany(c context.Context, filter string, value any, offset, limit int) ([]model.User, error) {
	var users []model.User

	sql := `select * from ` + model.UsersTableName
	if filter == "role" {
		sql += ` where role = '` + value.(string) + `'`
	} else if filter == "groupId" {
		sql += ` where id in (select userId from ` + model.UsersTableName + `_` + model.GroupsTableName + ` where groupId = ` + value.(string) + `)`
	}
	sql += ` order by username offset $1 limit $2`

	rows, err := ur.db.Query(c, sql, offset, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user model.User
		if err := rows.Scan(&user.Id, &user.Username, &user.Password, &user.Role, &user.Email, &user.FirstName, &user.LastName, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, err
		}

		groupIds, err := ur.GetGroups(c, user.Id)
		if err != nil {
			return nil, err
		}
		user.GroupIds = groupIds
		users = append(users, user)
	}

	return users, nil
}

func (ur *userPgRepository) DeleteOne(c context.Context, userId int) error {
	tx, err := ur.db.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	_, err = tx.Exec(c, `
		delete from `+model.UsersTableName+"_"+model.GroupsTableName+`
		where userId = $1
	`, userId)
	if err != nil {
		return err
	}

	_, err = tx.Exec(c, `
		delete from `+model.UsersTableName+`
		where id = $1
	`)
	if err != nil {
		return err
	}

	return tx.Commit(c)
}

func (ur *userPgRepository) AddToGroup(c context.Context, userId, groupId int) error {
	_, err := ur.db.Exec(c, `
		insert into `+model.UsersTableName+"_"+model.GroupsTableName+`
		values ($1, $2)
	`, userId, groupId)
	return err
}

func (ur *userPgRepository) RemoveFromGroup(c context.Context, userId, groupId int) error {
	_, err := ur.db.Exec(c, `
		delete from `+model.UsersTableName+"_"+model.GroupsTableName+`
		where userId = $1 and groupId = $2
	`, userId, groupId)
	return err
}

func (ur *userPgRepository) GetGroups(c context.Context, userId int) ([]int, error) {
	var groupIds []int

	rows, err := ur.db.Query(c, `
		select id from `+model.GroupsTableName+` g
		join `+model.UsersTableName+"_"+model.GroupsTableName+` ug on ug.groupId = g.id
		where ug.userId = $1
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		groupIds = append(groupIds, id)
	}

	return groupIds, nil
}
