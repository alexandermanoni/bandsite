package mysql

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/go-sql-driver/mysql"
)

type DB struct {
	db  *sql.DB
	cfg *mysql.Config
}

func (db *DB) DBInit() {
	db.cfg = mysql.NewConfig()
	db.cfg.User = os.Getenv("DBUSER")
	db.cfg.Passwd = os.Getenv("DBPASS")
	db.cfg.Net = "tcp"
	db.cfg.Addr = "127.0.0.1:3306"
	db.cfg.DBName = "bandsite"

	var err error
	db.db, err = sql.Open("mysql", db.cfg.FormatDSN())
	if err != nil {
		fmt.Errorf("%d", err)
	}

	pingErr := db.db.Ping()
	if pingErr != nil {
		fmt.Errorf("%d", pingErr)
	}

	fmt.Println("Connected to Database!")
}

func NewUserService(db *DB) *UserService {
	return &UserService{db: db}
}

func NewBandService(db *DB) *BandService {
	return &BandService{db: db}
}

func NewSetlistService(db *DB) *SetlistService {
	return &SetlistService{db: db}
}

func NewSongService(db *DB) *SongService {
	return &SongService{db: db}
}
