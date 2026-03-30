package databases

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_main"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
)

type Client struct {
	Data *db.Data
}

// AFConfiguration implements Interface.
func (c *Client) AFConfiguration() af_configuration.AFConfigurationInterface {
	return af_configuration.New(c.Data.AFConfiguration)
}

// AFMain implements Interface.
func (c *Client) AFMain() af_main.AFMainInterface {
	return af_main.New(c.Data.AFMain)
}

func New(data *db.Data) *Client { return &Client{Data: data} }

var _ Interface = &Client{}
