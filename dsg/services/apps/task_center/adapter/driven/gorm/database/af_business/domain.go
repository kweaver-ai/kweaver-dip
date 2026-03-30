package af_business

import (
	"context"

	"gorm.io/gorm"
)

const tableNameDomain = "business_model"

type domains struct {
	db *gorm.DB

	database string
	table    string
}

var _ DomainInterface = (*domains)(nil)

func newDomains(db *gorm.DB, dbName string) *domains {
	return &domains{
		db:       db,
		database: dbName,
		table:    tableNameDomain,
	}
}

// Get implements DomainInterface.
func (c *domains) Get(ctx context.Context, id string) (*Domain, error) {
	var record = Domain{ID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
