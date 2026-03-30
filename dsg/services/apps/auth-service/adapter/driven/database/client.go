package database

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database/dynamic"
)

type Client struct {
	DB *gorm.DB
}

// AFConfiguration implements Interface.
func (c *Client) AFConfiguration() af_configuration.Interface {
	return &af_configuration.Client{DB: c.DB}
}

// Dynamic implements Interface.
func (c *Client) Dynamic() dynamic.Interface {
	return &dynamic.Client{DB: c.DB}
}

var _ Interface = &Client{}

func New(db *db.GormDBWithoutDatabase) *Client {
	return &Client{DB: (*gorm.DB)(db).Debug()}
}
