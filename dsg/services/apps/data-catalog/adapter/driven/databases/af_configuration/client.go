package af_configuration

import "gorm.io/gorm"

type AFConfigurationClient struct {
	DB *gorm.DB
}

func New(db *gorm.DB) *AFConfigurationClient { return &AFConfigurationClient{DB: db} }

// Objects implements Interface.
func (c *AFConfigurationClient) Object() ObjectInterface { return newObjects(c.DB) }

var _ AFConfigurationInterface = &AFConfigurationClient{}
