package database

import (
	"context"
	"fmt"
	"lct/internal/config"
	"lct/internal/model"
	"runtime"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var maxConnectionAttempts = 5
var PgConn *Postgres

type Postgres struct {
	pool    *pgxpool.Pool
	Timeout int
}

func NewPostgres(timeout int) error {
	var (
		message  string
		attempts int    = 0
		dsn      string = fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable", config.Cfg.PostgresUser, config.Cfg.PostgresPassword, config.Cfg.PostgresHost, config.Cfg.PostgresDb)
	)

	for {
		time.Sleep(time.Second * 2)
		attempts++
		cfg, err := pgxpool.ParseConfig(dsn)
		if err != nil {
			if attempts > maxConnectionAttempts {
				message = "error while parsing pg config"
				break
			}
			continue
		}

		numCpu := runtime.NumCPU()
		if numCpu > 5 {
			cfg.MaxConns = int32(numCpu)
		} else {
			cfg.MaxConns = 5
		}
		cfg.MaxConnLifetime = time.Second * time.Duration(timeout)

		pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
		if err != nil {
			if attempts > maxConnectionAttempts {
				message = "error while connecting to pg"
				break
			}
			continue
		}

		err = pool.Ping(context.Background())
		if err != nil {
			if attempts > maxConnectionAttempts {
				message = "error while accessing pg"
				break
			}
			continue
		}

		PgConn = &Postgres{
			pool:    pool,
			Timeout: timeout,
		}
		return nil
	}

	return model.ErrPostgresCreateFailed{Message: message}
}

func (pg *Postgres) CreateJoinTables() error {
	_, err := pg.pool.Exec(context.Background(), `
		create table if not exists `+model.UsersTableName+"_"+model.GroupsTableName+`(
			userId int,
			groupId int,
			foreign key (userId) references users(id),
			foreign key (groupId) references groups(id)
		);

		create table if not exists `+model.CamerasTableName+"_"+model.GroupsTableName+`(
			cameraId int,
			groupId int,
			foreign key (cameraId) references cameras(id),
			foreign key (groupId) references groups(id)
		);

		create table if not exists `+model.VideosTableName+"_"+model.GroupsTableName+`(
			videoId int,
			groupId int,
			foreign key (videoId) references videos(id),
			foreign key (groupId) references groups(id)
		);
	`)
	return err
}

func (pg *Postgres) GetPool() *pgxpool.Pool {
	return pg.pool
}

func (pg *Postgres) Close() {
	pg.pool.Close()
}
