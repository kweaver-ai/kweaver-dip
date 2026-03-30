//go:build wireinject
// +build wireinject

package mock

import (
	"github.com/google/wire"
	driven "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver"
	mock "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver/middleware/mock"
	subject_domain "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver/subject_domain/v1"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/app"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/initialization"
	domain "github.com/kweaver-ai/dsg/services/apps/data-subject/domain"
	infrastructure "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
)

func InitApp(conf *my_config.Bootstrap) (*app.AppRunner, func(), error) {
	panic(wire.Build(
		initialization.InitAuditLog,
		driven.Set,
		driverSet,
		domain.Set,
		infrastructure.Set,
		app.NewApp,
		app.NewAppRunner,
	))
}

var driverSet = wire.NewSet(
	driver.NewRouter,
	driver.NewHttpEngine,
	mock.NewMiddleware,
	subject_domain.NewBusinessDomainService,
)
