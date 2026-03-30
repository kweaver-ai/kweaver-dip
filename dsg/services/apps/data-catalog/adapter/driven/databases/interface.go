package databases

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_main"
)

type Interface interface {
	AFConfiguration() af_configuration.AFConfigurationInterface
	AFMain() af_main.AFMainInterface
}
