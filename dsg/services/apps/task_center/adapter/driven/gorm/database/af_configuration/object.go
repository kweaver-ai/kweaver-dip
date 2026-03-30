package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const tableNameObject = "object"

type object struct {
	db *gorm.DB

	database string
	table    string
}

var _ ObjectInterface = (*object)(nil)

func newObjects(db *gorm.DB, dbName string) *object {
	return &object{
		db:       db,
		database: dbName,
		table:    tableNameObject,
	}
}

// Get implements ObjectInterface.
func (c *object) Get(ctx context.Context, id string) (*Object, error) {
	var record = Object{ID: id}
	if err := c.db.Table(c.database+"."+c.table).Where("id = ?", id).First(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
