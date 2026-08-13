package mysql

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"strconv"
	"strings"
	"time"

	mysql "example.com/bandsite"
	newbackend "example.com/bandsite"
	"golang.org/x/crypto/argon2"
)

// this line just does type checking where it sees if UserService can be cast to
// newbackend.UserService to make sure it implements the interface
var _ newbackend.UserService = (*UserService)(nil)

type UserService struct {
	db *DB
}

func (s *UserService) SignupUser(ctx context.Context, email string, password string, verifypassword string) error {
	// check passwords are the same
	if password != verifypassword {
		return mysql.ErrPasswordsDoNotMatch
	}

	// check email is formatted correctly
	address, err := mail.ParseAddress(email)
	if err != nil {
		return mysql.ErrEmailMalformed
	}
	addressstring := address.String()

	// check email doesn't already exist
	var exists bool
	err = s.db.db.QueryRowContext(ctx, `
		SELECT 1
		FROM users
		WHERE email = ?
	`, addressstring).Scan(&exists)
	if err != nil && !errors.Is(err, sql.ErrNoRows) { // error that isn't just user wasn't found
		return err
	}

	if exists {
		return mysql.ErrEmailAlreadyTaken
	}

	// store email and password
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = signupUser(ctx, tx, addressstring, password)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func hashPassword(password string) (string, error) {
	// generate salt for password hash
	// 16-bytes (128 bit)
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// get key from password
	// uses argon2id (recommended from https://www.latacora.com/blog/post-quantum-cryptographic-right-answers/)
	// uses 2nd recommended time, memory, threads from https://pkg.go.dev/golang.org/x/crypto/argon2#pkg-variables
	var time uint32 = 3
	var memory uint32 = 64 * 1024
	var threads uint8 = 4
	var keylength uint32 = 32
	idkey := argon2.IDKey([]byte(password), salt, time, memory, threads, keylength)

	// salt and hash encodings
	encoding := base64.RawStdEncoding
	saltEncoded := encoding.EncodeToString(salt)
	idkeyEncoded := encoding.EncodeToString(idkey)

	// build hash string
	var hashbuilder strings.Builder
	hashbuilder.WriteString("$argon2id")
	hashbuilder.WriteString("$v=19")
	hashbuilder.WriteString("$m=")
	hashbuilder.WriteString(fmt.Sprint(memory))
	hashbuilder.WriteString(",t=")
	hashbuilder.WriteString(fmt.Sprint(time))
	hashbuilder.WriteString(",p=")
	hashbuilder.WriteString(fmt.Sprint(threads))
	hashbuilder.WriteString("$")
	hashbuilder.WriteString(saltEncoded)
	hashbuilder.WriteString("$")
	hashbuilder.WriteString(idkeyEncoded)

	hash := hashbuilder.String()

	return hash, nil
}

func signupUser(ctx context.Context, tx *sql.Tx, email string, password string) error {
	// get hash
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}

	// store email and hash in db
	_, err = tx.ExecContext(ctx, `
		INSERT INTO users (email, passwordhash)
		VALUES (?, ?)
	`, email, hash)
	if err != nil {
		return err
	}

	return nil
}

func verifyPassword(password string, passwordhash string) (bool, error) {
	// hash structure $alg$v=?$m=?,t=?,p=?$salt$key
	// v - algorithm version
	// m - memory
	// t - time
	// p - threads

	// parse hash
	parts := strings.Split(passwordhash, "$")

	if len(parts) != 6 {
		return false, fmt.Errorf("Invalid hash format")
	}

	// only supports argon2id
	if parts[1] != "argon2id" {
		return false, fmt.Errorf("Unsupported hash algorithm: %v", parts[1])
	}

	// only supports version 19
	if parts[2] != "v=19" {
		return false, fmt.Errorf("Unsupported argon2id version: %v", parts[2])
	}

	// parse params
	var time uint32
	var memory uint32
	var threads uint8

	params := strings.Split(parts[3], ",")

	for _, param := range params {
		keyvalue := strings.SplitN(param, "=", 2)

		// keyvalue should have a key and a value
		if len(keyvalue) != 2 {
			return false, fmt.Errorf("Invalid parameter: %v", param)
		}

		// which key
		switch keyvalue[0] {
		case "t":
			value, err := strconv.ParseUint(keyvalue[1], 10, 32)
			if err != nil {
				return false, fmt.Errorf("Invalid time parameter: %v", err)
			}
			time = uint32(value)

		case "m":
			value, err := strconv.ParseUint(keyvalue[1], 10, 32)
			if err != nil {
				return false, fmt.Errorf("Invalid memory parameter: %v", err)
			}
			memory = uint32(value)

		case "p":
			value, err := strconv.ParseUint(keyvalue[1], 10, 8)
			if err != nil {
				return false, fmt.Errorf("Invalid thread parameter: %v", err)
			}
			threads = uint8(value)

		default:
			return false, fmt.Errorf("Unknown parameter: %v", param)
		}
	}

	// decode salt and hash
	encoding := base64.RawStdEncoding

	salt, err := encoding.DecodeString(parts[4])
	if err != nil {
		return false, fmt.Errorf("Invalid salt: %v", err)
	}

	hash, err := encoding.DecodeString(parts[5])
	if err != nil {
		return false, fmt.Errorf("Invalid hash: %v", err)
	}

	keylength := len(hash)

	// generate possible password's hash
	resulthash := argon2.IDKey([]byte(password), salt, time, memory, threads, uint32(keylength))

	// compare
	if subtle.ConstantTimeCompare(resulthash, hash) == 0 {
		return false, nil
	}

	return true, nil
}

func (s *UserService) LoginUser(ctx context.Context, email string, password string) (int, error) {
	// check email is formatted correctly
	address, err := mail.ParseAddress(email)
	if err != nil {
		return -1, mysql.ErrEmailMalformed
	}
	addressstring := address.String()

	// compare passwords
	// get passwordhash from db based on email
	var passwordhash string
	var id int
	err = s.db.db.QueryRowContext(ctx, `
		SELECT id, passwordhash
		FROM users
		WHERE email = ?
	`, addressstring).Scan(&id, &passwordhash)
	if err != nil {
		return -1, err
	}

	// compare
	match, err := verifyPassword(password, passwordhash)
	if err != nil {
		return -1, err
	}

	// passwords don't match
	if !match {
		return -1, nil
	}

	return id, nil
}

func (s *UserService) LogoutUser(ctx context.Context, userid int) error {
	// delete old token if it exists
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		DELETE FROM refreshtokens
		WHERE user_id = ?
	`, userid)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func (s *UserService) StoreRefreshToken(ctx context.Context, userid int, token string) error {
	// delete user's old token if it exists, benefit of refreshing refresh token
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		DELETE FROM refreshtokens
		WHERE user_id = ?
	`, userid)
	if err != nil {
		return err
	}

	// get current time
	currenttime := time.Now().UTC()

	// get refresh token expiration time (30 days from creation time)
	expiretime := time.Now().Add(30 * 24 * time.Hour).UTC()

	// hash token
	hasher := sha256.New()
	if _, err := hasher.Write([]byte(token)); err != nil {
		return err
	}
	hash := hex.EncodeToString(hasher.Sum(nil))

	// store in db
	_, err = tx.ExecContext(ctx, `
		INSERT INTO refreshtokens (user_id, token_hash, created_at, expires_at)
		VALUES (?, ?, ?, ?)
	`, userid, hash, currenttime, expiretime)
	if err != nil {
		return err
	}

	tx.Commit()

	return nil
}

func (s *UserService) VerifyRefreshToken(ctx context.Context, token string) (int, error) {
	// get current time
	currenttime := time.Now().UTC()

	// hash token
	hasher := sha256.New()
	if _, err := hasher.Write([]byte(token)); err != nil {
		return -1, err
	}
	hash := hex.EncodeToString(hasher.Sum(nil))

	// check db
	var expiretime time.Time
	var userid int
	err := s.db.db.QueryRowContext(ctx, `
		SELECT user_id, expires_at
		FROM refreshtokens
		WHERE token_hash = ?
	`, hash).Scan(&userid, &expiretime)
	if err != nil {
		return -1, err
	}

	// token good
	if currenttime.Before(expiretime) {
		return userid, nil
	}

	// token old, delete
	tx, err := s.db.db.BeginTx(ctx, nil)
	if err != nil {
		return -1, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		DELETE FROM refreshtokens
		WHERE token_hash = ?
	`, hash)
	if err != nil {
		return -1, err
	}

	tx.Commit()

	return -1, nil
}
