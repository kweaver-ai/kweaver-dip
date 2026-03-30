package database

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_business"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_main"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_tasks"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
)

type DatabaseClient struct {
	afBusiness      *af_business.AFBusinessClient
	afConfiguration *af_configuration.AFConfigurationClient
	afMain          *af_main.AFMainClient
	afTasks         *af_tasks.AFTasksClient
}

var _ DatabaseInterface = (*DatabaseClient)(nil)

// AFBusiness implements DatabaseInterface.
func (c *DatabaseClient) AFBusiness() af_business.AFBusinessInterface {
	return c.afBusiness
}

// AFConfiguration implements DatabaseInterface.
func (c *DatabaseClient) AFConfiguration() af_configuration.AFConfigurationInterface {
	return c.afConfiguration
}

// AFMain implements DatabaseInterface.
func (c *DatabaseClient) AFMain() af_main.AFMainInterface {
	return c.afMain
}

// AFTasks implements DatabaseInterface.
func (c *DatabaseClient) AFTasks() af_tasks.AFTasksInterface {
	return c.afTasks
}

func NewForData(data *db.Data) (*DatabaseClient, error) {
	var c DatabaseClient

	c.afBusiness = af_business.New(data.DB.Debug())
	c.afConfiguration = af_configuration.New(data.DB.Debug())
	c.afMain = af_main.New(data.DB.Debug())
	c.afTasks = af_tasks.New(data.DB.Debug())

	return &c, nil
}
