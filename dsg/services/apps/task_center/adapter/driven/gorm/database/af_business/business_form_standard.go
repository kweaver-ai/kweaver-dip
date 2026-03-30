package af_business

import (
	"context"

	"gorm.io/gorm"
)

const tableNameBusinessFormStandard = "business_form_standard"

type businessFormStandards struct {
	db *gorm.DB

	database string
	table    string
}

var _ BusinessFormStandardInterface = (*businessFormStandards)(nil)

func newBusinessFormStandards(db *gorm.DB, dbName string) *businessFormStandards {
	return &businessFormStandards{
		db:       db,
		database: dbName,
		table:    tableNameBusinessFormStandard,
	}
}

// Get implements BusinessFormStandardInterface.
func (c *businessFormStandards) Get(ctx context.Context, businessFormID string) (*BusinessFormStandard, error) {
	var record = BusinessFormStandard{BusinessFormID: businessFormID}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
