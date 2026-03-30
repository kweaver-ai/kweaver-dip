package settings

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/cmd/server/docs"
)

func Init() {
	docs.SwaggerInfo.Host = ConfigInstance.Doc.Host
	docs.SwaggerInfo.Version = ConfigInstance.Doc.Version
	if docs.SwaggerInfo.Host == "" {
		docs.SwaggerInfo.Host = "127.0.0.1:8143"
	}
	CheckConfigPath()
}
