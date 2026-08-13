package mysql

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"

	newbackend "example.com/bandsite"
	"github.com/gin-gonic/gin"
)

var _ newbackend.SongService = (*SongService)(nil)

type SongService struct {
	db *DB
}

func (s *SongService) FindSongsByBand(ctx context.Context, userid int, bandid int) ([]newbackend.Song, error) {
	var foundSongs []newbackend.Song

	rows, err := s.db.db.QueryContext(ctx, `
		SELECT song_id, name FROM re_songs rs 
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
		var song newbackend.Song

		if err := rows.Scan(&song.ID, &song.Name); err != nil {
			return nil, err
		}

		foundSongs = append(foundSongs, song)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return foundSongs, nil
}

func (s *SongService) CreateSong(ctx context.Context, userid int, bandid int, songname string) (newbackend.Song, error) {
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return newbackend.Song{}, err
	}
	defer tx.Rollback()

	song, err := createSong(ctx, tx, userid, bandid, songname)
	if err != nil {
		return newbackend.Song{}, err
	}

	tx.Commit()

	return song, nil
}

func createSong(ctx context.Context, tx *sql.Tx, userid int, bandid int, songname string) (newbackend.Song, error) {
	// create new song entry
	result, err := tx.ExecContext(ctx, `
		INSERT INTO re_songs (band_id, name)
		SELECT b.id, ?
		FROM bands b
		JOIN bandmembers bm ON bm.band_id = b.id
		WHERE b.id = ? AND bm.user_id = ?
	`, songname, bandid, userid)
	if err != nil {
		return newbackend.Song{}, err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return newbackend.Song{}, err
	}

	if rows == 0 {
		return newbackend.Song{}, fmt.Errorf("User does not have access to band: %v", bandid)
	}

	// get new song id
	newid, err := result.LastInsertId()
	if err != nil {
		return newbackend.Song{}, err
	}
	newsongid := int(newid)

	return newbackend.Song{ID: newsongid, Name: songname, Position: ""}, nil
}

func (s *SongService) UploadSongSource(ctx *gin.Context, userid int, songid int, songfile *multipart.FileHeader) error {
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = uploadSong(ctx, tx, userid, songid, songfile)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func userControlsSong(ctx context.Context, db *sql.DB, userid int, songid int) (bool, error) {
	var controls bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS(
		SELECT 1 FROM re_songs rs
		JOIN bandmembers bm ON rs.band_id = bm.band_id
		WHERE bm.user_id = ?
		AND rs.song_id = ?
		)
	`, userid, songid).Scan(&controls)
	if err != nil {
		return false, err
	}

	return controls, nil
}

func uploadSong(ctx *gin.Context, tx *sql.Tx, userid int, songid int, songfile *multipart.FileHeader) error {
	// check if user actually controls the song
	var controls bool
	err := tx.QueryRowContext(ctx, `
		SELECT EXISTS(
		SELECT 1 FROM re_songs rs
		JOIN bandmembers bm ON rs.band_id = bm.band_id
		WHERE bm.user_id = ?
		)
	`, userid).Scan(&controls)
	if err != nil {
		return err
	}

	if !controls {
		return fmt.Errorf("User doesn't control song: %v\n", songid)
	}

	// get filehash
	file, err := songfile.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	hasher := sha256.New()

	if _, err := io.Copy(hasher, file); err != nil {
		return err
	}

	hash := hex.EncodeToString(hasher.Sum(nil))

	// see if filehash already exists
	var exists bool
	err = tx.QueryRowContext(ctx, `
		SELECT EXISTS(
		SELECT 1 FROM songfiles
		WHERE filehash = ?
		)
	`, hash).Scan(&exists)
	if err != nil {
		return err
	}

	// file not already stored
	if !exists {
		destination := filepath.Join("songpath", hash)

		if err := ctx.SaveUploadedFile(songfile, destination); err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, `
			INSERT INTO songfiles (filehash, filepath) VALUES (?, ?)
		`, hash, destination)
		if err != nil {
			return err
		}
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE re_songs
		SET originalfilename = ?, filehash = ? WHERE song_id = ?
	`, songfile.Filename, hash, songid)
	if err != nil {
		return err
	}

	return nil
}

func (s *SongService) GetSongSource(ctx *gin.Context, userid int, songid int) error {
	controls, err := userControlsSong(ctx.Request.Context(), s.db.db, userid, songid)
	if err != nil {
		return err
	}

	if !controls {
		return fmt.Errorf("User %v doesn't control song %v\n", userid, songid)
	}

	var path string
	err = s.db.db.QueryRowContext(ctx, `
		SELECT filepath
		FROM songfiles sf
		JOIN re_songs ss
		ON ss.filehash = sf.filehash
		WHERE ss.song_id = ?
	`, songid).Scan(&path)
	if err != nil {
		return err
	}

	ctx.File(path)

	return nil
}

func (s *SongService) GetSongPositions(ctx context.Context, setlistid int) ([]newbackend.Song, error) {
	rows, err := s.db.db.QueryContext(ctx, "SELECT ss.song_id, ss.position FROM setlistsongs ss WHERE ss.setlist_id = ?", setlistid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var foundSongs []newbackend.Song

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

func (s *SongService) DeleteSong(ctx context.Context, userid int, songid int) error {
	// see if user controls the song
	controls, err := userControlsSong(ctx, s.db.db, userid, songid)
	if err != nil {
		return err
	}
	if !controls {
		return fmt.Errorf("User %v doesn't control song %v\n", userid, songid)
	}

	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = deleteSong(ctx, tx, songid)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func deleteSong(ctx context.Context, tx *sql.Tx, songid int) error {
	// get all setlists song is in
	var foundSetlists []int
	rows, err := tx.QueryContext(ctx, `
		SELECT setlist_id 
		FROM re_setlistsongs
		WHERE song_id = ?
	`, songid)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var setlist int
		if err := rows.Scan(&setlist); err != nil {
			return err
		}

		foundSetlists = append(foundSetlists, setlist)
	}

	rows.Close()

	if err := rows.Err(); err != nil {
		return err
	}

	// for each of those, adjust positions
	for _, setlist := range foundSetlists {
		// get old song position
		var position int
		err := tx.QueryRowContext(ctx, `
			SELECT position
			FROM re_setlistsongs
			WHERE song_id = ? 
			AND setlist_id = ?
		`, songid, setlist).Scan(&position)
		if errors.Is(err, sql.ErrNoRows) {
			continue
		} else if err != nil {
			return err
		}

		// adjust other song positions in that setlist
		_, execErr := tx.ExecContext(ctx, `
			UPDATE re_setlistsongs
			SET position = position - 1
			WHERE setlist_id = ?
			AND position > ?
		`, setlist, position)
		if execErr != nil {
			return execErr
		}
	}

	// remove song from setlistsongs
	_, execErr := tx.ExecContext(ctx, `
		DELETE FROM re_setlistsongs
		WHERE song_id = ?
	`, songid)
	if execErr != nil {
		return execErr
	}

	// remove song record from re_songs
	_, err = tx.ExecContext(ctx, `
		DELETE rs FROM re_songs rs
		WHERE rs.song_id = ?
	`, songid)
	if err != nil {
		return err
	}

	return nil
}
