//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"context"

	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/domain"
	goframe "github.com/kweaver-ai/idrm-go-frame"
)

func InitApp(ctx context.Context, cfg *settings.Config) (*goframe.App, func(), error) {
	panic(
		wire.Build(
			driver.Set,
			driven.Set,
			domain.Set,
			newApp,
		),
	)
}
