//go:build wireinject
// +build wireinject

package main

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain"
	go_frame "github.com/kweaver-ai/idrm-go-frame"
)

func InitApp(*settings.ConfigContains) (*go_frame.App, func(), error) {
	// panic(wire.Build(controller.ProviderSet, repository.RepositoryProviderSet, domain.DomainProviderSet, newApp))
	panic(wire.Build(
		gin.HttpProviderSet,
		gin.RouterSet,
		driven.DrivenSet,
		gin.ServiceProviderSet,
		domain.DomainProviderSet,
		newApp,
	))

}
