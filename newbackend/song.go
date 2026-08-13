package newbackend

import (
	"context"
	"mime/multipart"

	"github.com/gin-gonic/gin"
)

type Song struct {
	// id
	ID int `json:"id"`

	// song name
	Name string `json:"name"`

	// song position in setlist (changes per setlist)
	Position string `json:"position"`
}

type SongService interface {
	// create song in a band
	CreateSong(ctx context.Context, userid int, bandid int, songname string) (Song, error)

	// upload a song's audio file
	UploadSongSource(ctx *gin.Context, userid int, songid int, songfile *multipart.FileHeader) error

	// return a list of songs a band has
	FindSongsByBand(ctx context.Context, userid int, bandid int) ([]Song, error)

	// get the file for a song
	GetSongSource(ctx *gin.Context, userid int, songid int) error

	// get songpositions for a setlist - STILL OLD
	GetSongPositions(ctx context.Context, setlistid int) ([]Song, error)

	DeleteSong(ctx context.Context, userid int, songid int) error
}
