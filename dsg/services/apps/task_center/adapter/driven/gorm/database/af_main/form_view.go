package af_main

import (
	"context"

	"gorm.io/gorm"
)

const tableNameFormView = "form_view"

type formViews struct {
	db *gorm.DB

	database string
	table    string
}

var _ FormViewInterface = (*formViews)(nil)

func newFormViews(db *gorm.DB, dbName string) *formViews {
	return &formViews{
		db:       db,
		database: dbName,
		table:    tableNameFormView,
	}
}

// Get implements FormViewInterface.
func (c *formViews) Get(ctx context.Context, id string) (*FormView, error) {
	var record = FormView{ID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
