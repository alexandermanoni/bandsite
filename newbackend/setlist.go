package newbackend

import (
	"bytes"
	"context"

	"github.com/gin-gonic/gin"
)

type Setlist struct {
	// id
	ID int `json:"id"`

	// setlist name
	Name string `json:"name"`
}

type SetlistService interface {
	// create a setlist in a band
	CreateSetlist(ctx context.Context, userid int, bandid int, setlistname string) (Setlist, error)

	// return a list of setlists band has
	FindSetlistsByBand(ctx context.Context, userid int, bandid int) ([]Setlist, error)

	// return a list of song positions
	FindSongPositionsBySetlist(ctx context.Context, userid int, setlistid int) ([]Song, error)

	// return zip file of songs in order in a setlist
	GetSetlistZip(ctx *gin.Context, userid int, setlistid int) error

	// return pdf file of songs in order in a setlist
	GetSetlistPdf(ctx *gin.Context, userid int, setlistid int) (bytes.Buffer, error)

	// upload song positions
	UploadSongPositions(ctx context.Context, userid int, setlistid int, newpositions []Song) error

	// STILL OLD
	DeleteSetlist(ctx context.Context, userid int, setlistid int) error
}
