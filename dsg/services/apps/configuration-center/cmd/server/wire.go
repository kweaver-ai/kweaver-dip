//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/conf"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db"
	"github.com/redis/go-redis/v9"
)

func InitApp(*conf.Server, *db.Database, *redis.Options) (*AppRunner, func(), error) {
	panic(wire.Build(
		driver.Set,
		driven.Set,
		domain.Set,
		infrastructure.Set,
		newApp,
		NewAppRunnerWithInit))
}
