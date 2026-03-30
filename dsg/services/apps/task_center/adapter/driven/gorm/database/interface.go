package database

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_business"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_main"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_tasks"
)

type DatabaseInterface interface {
	AFMain() af_main.AFMainInterface
	AFBusiness() af_business.AFBusinessInterface
	AFConfiguration() af_configuration.AFConfigurationInterface
	AFTasks() af_tasks.AFTasksInterface
}
