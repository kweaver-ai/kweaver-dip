package af_business

import (
	"context"

	"gorm.io/gorm"
)

const tableNameBusinessModel = "business_model"

type businessModelClients struct {
	db *gorm.DB

	database string
	table    string
}

var _ BusinessModelInterface = (*businessModelClients)(nil)

func newBusinessModelClients(db *gorm.DB, dbName string) *businessModelClients {
	return &businessModelClients{
		db:       db,
		database: dbName,
		table:    tableNameBusinessModel,
	}
}

// Get implements BusinessModelInterface.
func (c *businessModelClients) Get(ctx context.Context, businessModelID string) (*BusinessModel, error) {
	var record = BusinessModel{BusinessModelID: businessModelID}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
