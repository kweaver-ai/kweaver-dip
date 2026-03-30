package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const TableNameUser = "user"

type User struct {
	ID    string `json:"id,omitempty" gorm:"primaryKey"`
	Scope string `json:"scope,omitempty"`
}

func (User) TableName() string { return DatabaseName + "." + TableNameUser }

type UsersGetter interface {
	Users() UserInterface
}

type UserInterface interface {
	Get(ctx context.Context, id string) (*User, error)
	List(ctx context.Context) ([]User, error)
}

type users struct {
	db *gorm.DB
}

// Get implements UserInterface.
func (c *users) Get(ctx context.Context, id string) (result *User, err error) {
	result = &User{ID: id}
	if err = c.db.WithContext(ctx).Take(result).Error; err != nil {
		return nil, err
	}
	return
}

// List implements UserInterface.
func (c *users) List(ctx context.Context) (result []User, err error) {
	if err = c.db.WithContext(ctx).Find(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ UserInterface = &users{}
