package af_configuration

import (
	"context"

	"gorm.io/gorm"
)

const tableNameDatasource = "datasource"

type datasource struct {
	db *gorm.DB

	database string
	table    string
}

var _ DatasourceInterface = (*datasource)(nil)

func newDatasources(db *gorm.DB, dbName string) *datasource {
	return &datasource{
		db:       db,
		database: dbName,
		table:    tableNameDatasource,
	}
}

// Get implements DatasourceInterface.
func (c *datasource) Get(ctx context.Context, id string) (*Datasource, error) {
	var record = Datasource{ID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (c *datasource) GetByHuaAoId(ctx context.Context, id string) (*Datasource, error) {
	var record = Datasource{HuaAoId: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
