package newbackend

import (
	"context"
	"errors"
)

var ErrPasswordsDoNotMatch = errors.New("passwords do not match")
var ErrEmailMalformed = errors.New("email is malformed")
var ErrEmailAlreadyTaken = errors.New("email is already in use")

// User in bandsite system
type User struct {
	// id
	ID int `json:"id"`

	// email
	Email string `json:"email"`
}

// UserInterface is a service for managing users
type UserService interface {
	// sign up user & store password securely
	SignupUser(ctx context.Context, email string, password string, verifypassword string) error

	// check email, password are correct and return user id
	LoginUser(ctx context.Context, email string, password string) (int, error)

	// revoke refresh token
	LogoutUser(ctx context.Context, userid int) error

	// store token for user to refresh auth tokens
	StoreRefreshToken(ctx context.Context, userid int, token string) error

	// verify if refresh token is expired or not (if yes, deletes token, if not returns good)
	VerifyRefreshToken(ctx context.Context, token string) (int, error)
}
