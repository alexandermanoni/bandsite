package mysql

import (
	"context"
	"database/sql"
	"fmt"

	newbackend "example.com/bandsite"
)

var _ newbackend.BandService = (*BandService)(nil)

type BandService struct {
	db *DB
}

// [NOTE]: this should be updated to use the context from the http request
func (s *BandService) FindBandsByUser(ctx context.Context, userid int) ([]newbackend.Band, error) {
	var foundBands []newbackend.Band

	rows, err := s.db.db.QueryContext(ctx, "SELECT ba.id, ba.name FROM bands ba JOIN bandmembers bm ON ba.id = bm.band_id WHERE bm.user_id = ?", userid)
	if err != nil {
		return nil, fmt.Errorf("SQL_ERR bands for user %v: %v", userid, err)
	}
	defer rows.Close()

	for rows.Next() {
		var band newbackend.Band

		if err := rows.Scan(&band.ID, &band.Name); err != nil {
			return nil, fmt.Errorf("SQL_RES_ERR bands for user %v: %v", userid, err)
		}

		foundBands = append(foundBands, band)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ERR bands for user %v: %v", userid, err)
	}

	return foundBands, nil
}

// [NOTE]: UPDATE bandmembers SO THAT IT'S UNIQUE AND YOU CAN'T HAVE COPIES OF THE SAME BANDMEMBER IN THE SAME BAND
func (s *BandService) CreateBand(ctx context.Context, userid int, bandname string) (newbackend.Band, error) {
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return newbackend.Band{}, err
	}
	defer tx.Rollback()

	newband, err := createBand(ctx, tx, userid, bandname)
	if err != nil {
		return newbackend.Band{}, err
	}

	tx.Commit()

	return newband, nil
}

func createBand(ctx context.Context, tx *sql.Tx, userid int, bandname string) (newbackend.Band, error) {
	result, execErr := tx.ExecContext(ctx, "INSERT INTO bands (name) VALUES (?)", bandname)
	if execErr != nil {
		return newbackend.Band{}, execErr
	}

	// get new band id
	id, idErr := result.LastInsertId()
	if idErr != nil {
		return newbackend.Band{}, idErr
	}
	newbandid := int(id)

	// create new bandmember entry
	result, execErr = tx.ExecContext(ctx, "INSERT INTO bandmembers (band_id, user_id) VALUES (?, ?)", newbandid, userid)
	if execErr != nil {
		return newbackend.Band{}, execErr
	}

	newband := newbackend.Band{
		ID:   newbandid,
		Name: bandname,
	}

	return newband, nil
}

func userControlsBand(ctx context.Context, db *sql.DB, userid int, bandid int) (bool, error) {
	var controls bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS(
		SELECT 1 FROM bands b
		JOIN bandmembers bm ON b.id = bm.band_id
		WHERE bm.user_id = ?
		AND b.id = ?
		)
	`, userid, bandid).Scan(&controls)
	if err != nil {
		return false, err
	}

	return controls, nil
}

func (s *BandService) DeleteBand(ctx context.Context, userid int, bandid int) error {
	// see if user controls the band
	controls, err := userControlsBand(ctx, s.db.db, userid, bandid)
	if err != nil {
		return err
	}
	if !controls {
		return fmt.Errorf("User %v doesn't control band %v\n", userid, bandid)
	}

	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = deleteBand(ctx, tx, bandid)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func deleteBand(ctx context.Context, tx *sql.Tx, bandid int) error {
	// delete everything (if db is updated to have foreign key cascades)
	// _, err := tx.ExecContext(ctx, `
	// 	DELETE b, bm, rss, rst, rs
	// 	FROM bands b
	// 	LEFT JOIN bandmembers bm
	// 		ON bm.band_id = b.id
	// 	LEFT JOIN re_setlistsongs rss
	// 		ON rss.band_id = b.id
	// 	LEFT JOIN re_setlists rst
	// 		ON rst.band_id = b.id
	// 	LEFT JOIN re_songs rs
	// 		ON rs.band_id = b.id
	// 	WHERE b.id = ?
	// `, bandid)
	// if err != nil {
	// 	return err
	// }

	// Setlist/song relationships
	if _, err := tx.ExecContext(ctx, `
		DELETE FROM re_setlistsongs
		WHERE band_id = ?
	`, bandid); err != nil {
		return err
	}

	// Setlists
	if _, err := tx.ExecContext(ctx, `
		DELETE FROM re_setlists
		WHERE band_id = ?
	`, bandid); err != nil {
		return err
	}

	// Songs
	if _, err := tx.ExecContext(ctx, `
		DELETE FROM re_songs
		WHERE band_id = ?
	`, bandid); err != nil {
		return err
	}

	// Members
	if _, err := tx.ExecContext(ctx, `
		DELETE FROM bandmembers
		WHERE band_id = ?
	`, bandid); err != nil {
		return err
	}

	// Finally, the band
	if _, err := tx.ExecContext(ctx, `
		DELETE FROM bands
		WHERE id = ?
	`, bandid); err != nil {
		return err
	}

	return nil
}
