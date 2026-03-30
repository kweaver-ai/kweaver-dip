package af_business

import (
	"gorm.io/gorm"
)

type AFBusinessClient struct {
	db *gorm.DB

	dbName string
}

var _ AFBusinessInterface = (*AFBusinessClient)(nil)

// BusinessFormStandard implements AFBusinessInterface.
func (c *AFBusinessClient) BusinessFormStandard() BusinessFormStandardInterface {
	return newBusinessFormStandards(c.db, c.dbName)
}

// BusinessModel implements AFBusinessInterface.
func (c *AFBusinessClient) BusinessModel() BusinessModelInterface {
	return newBusinessModelClients(c.db, c.dbName)
}

// Domain implements AFBusinessInterface.
func (c *AFBusinessClient) Domain() DomainInterface {
	return newDomains(c.db, c.dbName)
}

// User implements AFBusinessInterface.
func (c *AFBusinessClient) User() UserInterface {
	return newUser(c.db, c.dbName)
}

func New(db *gorm.DB) *AFBusinessClient {
	return NewWithDBName(db, "af_business")
}

func NewWithDBName(db *gorm.DB, dbName string) *AFBusinessClient {
	return &AFBusinessClient{db: db, dbName: dbName}
}
