//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm"
)

// ProviderSet is server providers.
//var appRunnerSet = wire.NewSet(wire.Struct(new(AppRunner), "*"))

func InitApp(config *settings.Config) (*AppRunner, func(), error) {
	panic(wire.Build(
		infrastructure.Set,
		driver.DriverSet,
		controller.HttpProviderSet,
		controller.RouterSet,
		controller.ControllerProviderSet,
		domain.ProviderSet,
		driven.Set,
		gorm.RepositoryProviderSet,
		util.NewRedisson,
		newApp,
		NewAppRunner, impl.NewUseCaseImpl))
}
