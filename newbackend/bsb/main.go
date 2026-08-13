package main

import (
	"example.com/bandsite/http"

	"example.com/bandsite/mysql"
)

var database mysql.DB
var server http.Server

func main() {
	database.DBInit()
	server = *http.NewServer()
	server.UserService = mysql.NewUserService(&database)
	server.BandService = mysql.NewBandService(&database)
	server.SetlistService = mysql.NewSetlistService(&database)
	server.SongService = mysql.NewSongService(&database)
	server.StartServer()
}
