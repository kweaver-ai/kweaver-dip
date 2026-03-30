package af_configuration

import "gorm.io/gorm"

type AFConfigurationClient struct {
	db *gorm.DB

	dbName string
}

var _ AFConfigurationInterface = (*AFConfigurationClient)(nil)

// Datasources implements AFConfigurationInterface.
func (c *AFConfigurationClient) Datasources() DatasourceInterface {
	return newDatasources(c.db, c.dbName)
}

// InfoSystems implements AFConfigurationInterface.
func (c *AFConfigurationClient) InfoSystems() InfoSystemInterface {
	return newInfoSystems(c.db, c.dbName)
}

// Objects implements AFConfigurationInterface.
func (c *AFConfigurationClient) Objects() ObjectInterface {
	return newObjects(c.db, c.dbName)
}

// Users implements AFConfigurationInterface.
func (c *AFConfigurationClient) Users() UserInterface {
	return newUsers(c.db, c.dbName)
}

func New(db *gorm.DB) *AFConfigurationClient {
	return NewWithDBName(db, "af_configuration")
}

func NewWithDBName(db *gorm.DB, dbName string) *AFConfigurationClient {
	return &AFConfigurationClient{db: db, dbName: dbName}
}
