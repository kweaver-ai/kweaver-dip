package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const tableNameUser = "user"

type user struct {
	db *gorm.DB

	database string
	table    string
}

var _ UserInterface = (*user)(nil)

func newUsers(db *gorm.DB, dbName string) *user {
	return &user{
		db:       db,
		database: dbName,
		table:    tableNameUser,
	}
}

// Get implements ObjectInterface.
func (c *user) Get(ctx context.Context, id string) (*User, error) {
	var record = User{ID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
