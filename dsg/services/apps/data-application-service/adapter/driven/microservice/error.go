package microservice

import (
	"fmt"
	"strings"
)

type UserNotFoundError struct {
	// User ID
	ID string `json:"id,omitempty"`
}

// Error implements error.
func (err *UserNotFoundError) Error() string {
	return fmt.Sprintf("user %q not found", err.ID)
}

var _ error = &UserNotFoundError{}

type UsersNotFoundError struct {
	// User ID slice
	IDs []string `json:"i_ds,omitempty"`
}

// Error implements error.
func (err *UsersNotFoundError) Error() string {
	return fmt.Sprintf("users [%s] not found", strings.Join(err.IDs, ", "))
}

var _ error = &UsersNotFoundError{}
