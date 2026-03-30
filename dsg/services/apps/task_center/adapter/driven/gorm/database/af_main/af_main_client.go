package af_main

import "gorm.io/gorm"

type AFMainClient struct {
	db *gorm.DB

	dbName string
}

var _ AFMainInterface = (*AFMainClient)(nil)

// FormViews implements AFMainInterface.
func (c *AFMainClient) FormViews() FormViewInterface {
	return newFormViews(c.db, c.dbName)
}

func New(db *gorm.DB) *AFMainClient {
	return NewWithDBName(db, "af_main")
}

func NewWithDBName(db *gorm.DB, dbName string) *AFMainClient {
	return &AFMainClient{db: db, dbName: dbName}
}
