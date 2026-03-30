package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const tableNameInfoSystem = "info_system"

type infoSystem struct {
	db *gorm.DB

	database string
	table    string
}

var _ InfoSystemInterface = (*infoSystem)(nil)

func newInfoSystems(db *gorm.DB, dbName string) *infoSystem {
	return &infoSystem{
		db:       db,
		database: dbName,
		table:    tableNameInfoSystem,
	}
}

// Get implements InfoSystemInterface.
func (c *infoSystem) Get(ctx context.Context, id string) (*InfoSystem, error) {
	var record = InfoSystem{ID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
