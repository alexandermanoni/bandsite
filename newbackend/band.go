package newbackend

import "context"

type Band struct {
	// id
	ID int `json:"id"`

	// band name
	Name string `json:"name"`
}

type BandService interface {
	// create a band in db & add update Band arg's id
	CreateBand(ctx context.Context, userid int, bandname string) (Band, error)

	// return list of bands user is a part of (STILL BAD (i think))
	FindBandsByUser(ctx context.Context, userid int) ([]Band, error)

	DeleteBand(ctx context.Context, userid int, bandid int) error
}
