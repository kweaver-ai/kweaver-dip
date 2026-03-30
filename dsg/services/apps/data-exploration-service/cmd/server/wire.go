//go:build wireinject
// +build wireinject

package server

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure"
)

var appRunnerSet = wire.NewSet(wire.Struct(new(AppRunner), "*"))

func InitApp(httpCfg settings.HttpConf) (*AppRunner, func(), error) {
	panic(
		wire.Build(
			driver.RouterSet,
			driver.Set,
			driven.Set,
			domain.Set,
			infrastructure.Set,
			newApp,
			toTransportServer,
			appRunnerSet,
		),
	)
}
