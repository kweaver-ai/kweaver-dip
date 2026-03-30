//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"github.com/google/wire"
	driven "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven"
	driver "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/app"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/initialization"
	domain "github.com/kweaver-ai/dsg/services/apps/data-subject/domain"
	infrastructure "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
)

// var appRunnerSet = wire.NewSet(wire.Struct(new(go_frame.App), "*"))

func InitApp(conf *my_config.Bootstrap) (*app.AppRunner, func(), error) {
	panic(wire.Build(
		initialization.InitAuditLog,
		driven.Set,
		driver.Set,
		domain.Set,
		infrastructure.Set,
		app.NewApp,
		app.NewAppRunner,
	))
}
