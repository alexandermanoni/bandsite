package mysql

import (
	"archive/zip"
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	newbackend "example.com/bandsite"
	"github.com/gin-gonic/gin"
	"github.com/go-pdf/fpdf"
)

var _ newbackend.SetlistService = (*SetlistService)(nil)

type SetlistService struct {
	db *DB
}

func (s *SetlistService) CreateSetlist(ctx context.Context, userid int, bandid int, setlistname string) (newbackend.Setlist, error) {
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return newbackend.Setlist{}, err
	}
	defer tx.Rollback()

	setlist, err := createSetlist(ctx, tx, userid, bandid, setlistname)
	if err != nil {
		return newbackend.Setlist{}, err
	}

	tx.Commit()

	return setlist, nil
}

func createSetlist(ctx context.Context, tx *sql.Tx, userid int, bandid int, setlistname string) (newbackend.Setlist, error) {
	// create new setlist entry
	result, err := tx.ExecContext(ctx, `
		INSERT INTO re_setlists (band_id, name)
		SELECT b.id, ?
		FROM bands b
		JOIN bandmembers bm ON bm.band_id = b.id
		WHERE b.id = ? AND bm.user_id = ?
	`, setlistname, bandid, userid)
	if err != nil {
		return newbackend.Setlist{}, err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return newbackend.Setlist{}, err
	}

	if rows == 0 {
		return newbackend.Setlist{}, fmt.Errorf("User does not have access to band: %v", bandid)
	}

	// get new setlist id
	newid, err := result.LastInsertId()
	if err != nil {
		return newbackend.Setlist{}, err
	}
	newsetlistid := int(newid)

	return newbackend.Setlist{ID: newsetlistid, Name: setlistname}, nil
}

func (s *SetlistService) FindSetlistsByBand(ctx context.Context, userid int, bandid int) ([]newbackend.Setlist, error) {
	var foundSetlists []newbackend.Setlist

	rows, err := s.db.db.QueryContext(ctx, `
		SELECT setlist_id, name FROM re_setlists rs
		JOIN bandmembers bm
		ON rs.band_id = bm.band_id
		WHERE bm.user_id = ?
		AND rs.band_id = ?
	`, userid, bandid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var setlist newbackend.Setlist
		if err := rows.Scan(&setlist.ID, &setlist.Name); err != nil {
			return nil, err
		}

		foundSetlists = append(foundSetlists, setlist)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return foundSetlists, nil
}

func (s *SetlistService) FindSongPositionsBySetlist(ctx context.Context, userid int, setlistid int) ([]newbackend.Song, error) {
	// check if user controls setlistid
	controls, err := userControlsSetlist(ctx, s.db.db, userid, setlistid)
	if err != nil {
		return nil, err
	}

	if !controls {
		return nil, fmt.Errorf("User doesn't controls setlist %v\n", setlistid)
	}

	var foundSongs []newbackend.Song

	rows, err := s.db.db.QueryContext(ctx, `
		SELECT rss.song_id, rss.position
		FROM re_setlistsongs rss
		JOIN bandmembers bm
		ON bm.band_id = rss.band_id
		WHERE bm.user_id = ?
		AND rss.setlist_id = ?
	`, userid, setlistid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var song newbackend.Song
		if err := rows.Scan(&song.ID, &song.Position); err != nil {
			return nil, err
		}

		foundSongs = append(foundSongs, song)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return foundSongs, nil
}

func userControlsSetlist(ctx context.Context, db *sql.DB, userid int, setlistid int) (bool, error) {
	var controls bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS(
		SELECT 1 FROM re_setlists rs
		JOIN bandmembers bm ON rs.band_id = bm.band_id
		WHERE bm.user_id = ?
		AND rs.setlist_id = ?
		)
	`, userid, setlistid).Scan(&controls)
	if err != nil {
		return false, err
	}

	return controls, nil
}

func sanitizeFilename(name string) string {
	re := regexp.MustCompile(`[^\p{L}\p{N}\s._()\-]`)
	name = re.ReplaceAllString(name, "")

	// collapse spaces
	name = strings.Join(strings.Fields(name), " ")

	// prevent dots
	name = strings.Trim(name, ". ")

	// don't have path, just name
	name = filepath.Base(name)

	return name
}

func (s *SetlistService) GetSetlistZip(ctx *gin.Context, userid int, setlistid int) error {
	// check if user controls setlistid
	controls, err := userControlsSetlist(ctx, s.db.db, userid, setlistid)
	if err != nil {
		return err
	}

	if !controls {
		return fmt.Errorf("User doesn't controls setlist %v\n", setlistid)
	}

	// get song info
	var foundSongs []newbackend.Song
	var foundHashes []string

	rows, err := s.db.db.QueryContext(ctx, `
		SELECT rs.name, COALESCE(rs.filehash, '') AS filehash, rss.position
		FROM re_setlistsongs rss
		JOIN re_songs rs
		ON rs.song_id = rss.song_id
		AND rs.band_id = rss.band_id
		JOIN bandmembers bm
		ON bm.band_id = rss.band_id
		WHERE bm.user_id = ?
		AND rss.setlist_id = ?
	`, userid, setlistid)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var song newbackend.Song
		var hash string
		if err := rows.Scan(&song.Name, &hash, &song.Position); err != nil {
			return err
		}

		foundSongs = append(foundSongs, song)
		foundHashes = append(foundHashes, hash)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	rows.Close()

	ctx.Header("Content-Type", "application/zip")
	ctx.Header("Content-Disposition", `attachment; filename="test.zip"`)

	archive := zip.NewWriter(ctx.Writer)
	defer archive.Close()

	for i, path := range foundHashes {
		// if there's no file associated with song, ignore
		if path == "" {
			continue
		}

		songpath := filepath.Join("songpath", path)

		file, err := os.Open(songpath)
		if err != nil {
			ctx.Error(err)
			return err
		}

		var result strings.Builder
		result.WriteString(foundSongs[i].Position)
		result.WriteString(" - ")
		result.WriteString(foundSongs[i].Name)

		finalname := sanitizeFilename(result.String()) + ".mp3"

		//writer, err := archive.Create(result.String())
		writer, err := archive.Create(finalname)
		if err != nil {
			file.Close()
			ctx.Error(err)
			return err
		}

		if _, err := io.Copy(writer, file); err != nil {
			file.Close()
			ctx.Error(err)
			return err
		}

		file.Close()
	}

	return nil
}

func (s *SetlistService) GetSetlistPdf(ctx *gin.Context, userid int, setlistid int) (bytes.Buffer, error) {
	// check if user controls setlistid
	controls, err := userControlsSetlist(ctx, s.db.db, userid, setlistid)
	if err != nil {
		return bytes.Buffer{}, err
	}

	if !controls {
		return bytes.Buffer{}, fmt.Errorf("User doesn't controls setlist %v\n", setlistid)
	}

	// get song info
	var foundSongs []newbackend.Song

	rows, err := s.db.db.QueryContext(ctx, `
		SELECT rs.name, rss.position
		FROM re_setlistsongs rss
		JOIN re_songs rs
		ON rs.song_id = rss.song_id
		AND rs.band_id = rss.band_id
		JOIN bandmembers bm
		ON bm.band_id = rss.band_id
		WHERE bm.user_id = ?
		AND rss.setlist_id = ?
	`, userid, setlistid)
	if err != nil {
		return bytes.Buffer{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var song newbackend.Song
		if err := rows.Scan(&song.Name, &song.Position); err != nil {
			return bytes.Buffer{}, err
		}

		foundSongs = append(foundSongs, song)
	}

	if err := rows.Err(); err != nil {
		return bytes.Buffer{}, err
	}

	rows.Close()

	// get setlist name
	var setlistName string
	err = s.db.db.QueryRowContext(ctx, `
		SELECT name
		FROM re_setlists
		WHERE setlist_id = ?
	`, setlistid).Scan(&setlistName)
	if err != nil {
		return bytes.Buffer{}, err
	}

	// generate pdf file from song info
	buffer, err := generatePdf(setlistName, foundSongs)
	if err != nil {
		return bytes.Buffer{}, err
	}

	return buffer, err
}

func generatePdf(setlistname string, foundsongs []newbackend.Song) (bytes.Buffer, error) {
	// generate song string

	// sort array
	sort.Slice(foundsongs, func(i, j int) bool {
		return foundsongs[i].Position < foundsongs[j].Position
	})

	var result strings.Builder

	for _, song := range foundsongs {
		result.WriteString(song.Position)
		result.WriteString(" - ")
		result.WriteString(song.Name)
		result.WriteString("\n")
	}

	// create pdf
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 20)
	pdf.Cell(40, 10, setlistname)

	pdf.Ln(20)

	pdf.SetFont("Arial", "B", 12)
	pdf.MultiCell(0, 8, result.String(), "", "L", false)

	// get pdf bytes
	var buffer bytes.Buffer

	if err := pdf.Output(&buffer); err != nil {
		return bytes.Buffer{}, err
	}

	return buffer, nil
}

func (s *SetlistService) UploadSongPositions(ctx context.Context, userid int, setlistid int, newpositions []newbackend.Song) error {
	// check if user controls setlistid
	controls, err := userControlsSetlist(ctx, s.db.db, userid, setlistid)
	if err != nil {
		return err
	}

	if !controls {
		return fmt.Errorf("User doesn't controls setlist %v\n", setlistid)
	}

	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = uploadSongPositions(ctx, tx, userid, setlistid, newpositions)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func uploadSongPositions(ctx context.Context, tx *sql.Tx, userid int, setlistid int, newpositions []newbackend.Song) error {
	// if no new positions, don't do anything
	if len(newpositions) == 0 {
		return nil
	}

	// delete old entries
	_, err := tx.ExecContext(ctx, `
		DELETE rs FROM re_setlistsongs rs
		JOIN bandmembers bm
		ON rs.band_id = bm.band_id
		WHERE bm.user_id = ?
		AND rs.setlist_id = ?		
	`, userid, setlistid)
	if err != nil {
		return err
	}

	// insert new entries
	// get bandid
	var bandid int
	err = tx.QueryRowContext(ctx, "SELECT band_id FROM re_setlists WHERE setlist_id = ?", setlistid).Scan(&bandid)
	if err != nil {
		return err
	}

	// have to build up insert
	// [note]: this might be insecure since song_id ownership isnt checked
	query := "INSERT INTO re_setlistsongs (band_id, setlist_id, song_id, position) VALUES"
	args := make([]interface{}, 0, len(newpositions)*4)
	values := make([]string, 0, len(newpositions))

	for _, song := range newpositions {
		values = append(values, "(?, ?, ?, ?)")
		args = append(args, bandid, setlistid, song.ID, song.Position)
	}

	query += strings.Join(values, ", ")
	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	return nil
}

func (s *SetlistService) DeleteSetlist(ctx context.Context, userid int, setlistid int) error {
	// check if user controls setlistid
	controls, err := userControlsSetlist(ctx, s.db.db, userid, setlistid)
	if err != nil {
		return err
	}

	if !controls {
		return fmt.Errorf("User doesn't controls setlist %v\n", setlistid)
	}

	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = deleteSetlist(ctx, tx, userid, setlistid)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func deleteSetlist(ctx context.Context, tx *sql.Tx, userid int, setlistid int) error {
	// delete song position records
	_, err := tx.ExecContext(ctx, `
		DELETE rss FROM re_setlistsongs rss
		WHERE setlist_id = ?
	`, setlistid)
	if err != nil {
		return err
	}

	// delete setlist record
	_, err = tx.ExecContext(ctx, `
		DELETE rs FROM re_setlists rs
		WHERE rs.setlist_id = ?
	`, setlistid)
	if err != nil {
		return err
	}

	return nil
}
