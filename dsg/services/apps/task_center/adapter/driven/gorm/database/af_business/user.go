package af_business

import (
	"context"

	"gorm.io/gorm"
)

const tableNameUser = "user"

type users struct {
	db *gorm.DB

	database string
	table    string
}

var _ UserInterface = (*users)(nil)

func newUser(db *gorm.DB, dbName string) *users {
	return &users{
		db:       db,
		database: dbName,
		table:    tableNameUser,
	}
}

// Get implements UserInterface.
func (c *users) Get(ctx context.Context, id int) (*User, error) {
	var record = User{ID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
