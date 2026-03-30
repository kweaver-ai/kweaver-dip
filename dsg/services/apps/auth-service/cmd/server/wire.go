//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"github.com/google/wire"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure"
	af_go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

var appRunnerSet = wire.NewSet(wire.Struct(new(AppRunner), "*"))

func newApp(hs *rest.Server, consumer *mq.KafkaConsumer) *af_go_frame.App {
	return af_go_frame.New(
		af_go_frame.Name(Name),
		af_go_frame.Server(hs, consumer),
	)
}

func InitApp(s *settings.Settings) (*AppRunner, func(), error) {
	panic(wire.Build(
		driver.HttpProviderSet,
		driver.RouterSet,
		driver.ProviderSet,
		driven.Set,
		domain.ProviderSet,
		infrastructure.Set,
		newApp,
		appRunnerSet,
		settings.Set,
	))
}
