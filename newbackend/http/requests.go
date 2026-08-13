package http

import newbackend "example.com/bandsite"

type SignUpRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Verify   string `json:"verifypassword"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateBandRequest struct {
	BandName string `json:"newbandname"`
}

type CreateSongRequest struct {
	BandID   string `json:"bandid"`
	SongName string `json:"newsongname"`
}

type CreateSetlistRequest struct {
	BandID      string `json:"bandid"`
	SetlistName string `json:"newsetlistname"`
}

type UploadSetlistRequest struct {
	SetlistID     string            `json:"setlistid"`
	SongPositions []newbackend.Song `json:"songpositions"`
}
