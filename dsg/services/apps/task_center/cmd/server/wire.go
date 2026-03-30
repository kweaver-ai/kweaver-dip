//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/task_center/controller"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/conf"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
)

var appRunnerSet = wire.NewSet(wire.Struct(new(AppRunner), "*"))

func InitApp(*conf.Server, *db.Database) (*AppRunner, func(), error) {
	// panic(wire.Build(controller.ProviderSet, repository.RepositoryProviderSet, domain.DomainProviderSet, newApp))
	panic(wire.Build(
		controller.Set,
		driver.HttpProviderSet,
		driver.RouterSet,
		driven.Set,
		driver.ServiceProviderSet,
		domain.ProviderSet,
		gorm.RepositoryProviderSet,
		infrastructure.Set,
		newApp,
		appRunnerSet))
}
