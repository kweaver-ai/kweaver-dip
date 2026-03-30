package app

import (
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/callbacks"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
	go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

func NewApp(conf *my_config.Bootstrap, hs *rest.Server) *go_frame.App {
	return go_frame.New(
		go_frame.Name(conf.Server.Name),
		go_frame.Server(hs),
	)
}

type AppRunner struct {
	Callbacks *callbacks.Transports
	App       *go_frame.App
}

func NewAppRunner(app *go_frame.App, cs *callbacks.Transports) *AppRunner {
	return &AppRunner{App: app, Callbacks: cs}
}

func (a *AppRunner) Register() {
	a.Callbacks.Register()
}

func (a *AppRunner) Run() error {
	a.Callbacks.Register()
	return a.App.Run()
}
