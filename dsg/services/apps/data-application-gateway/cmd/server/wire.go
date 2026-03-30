//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/domain"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
)

var appRunnerSet = wire.NewSet(wire.Struct(new(AppRunner), "*"))

func InitApp(s *settings.Settings) (*AppRunner, func(), error) {
	panic(wire.Build(
		driver.HttpProviderSet,
		driver.RouterSet,
		driver.ProviderSet,
		driven.Set,
		domain.ProviderSet,
		repository.NewRedis,
		db.NewData,
		newApp,
		appRunnerSet))
}
