package database

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/database/dynamic"
)

type Interface interface {
	// 动态客户端
	Dynamic() dynamic.Interface

	AFConfiguration() af_configuration.Interface
}
