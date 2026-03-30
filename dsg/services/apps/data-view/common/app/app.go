package app

import (
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq"
	formView "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view/v1"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

func NewApp(conf *my_config.Bootstrap, hs *rest.Server, ss []transport.Server) *go_frame.App {
	return go_frame.New(
		go_frame.Name(conf.Server.Name),
		go_frame.Server(hs),
		go_frame.Server(ss...),
	)
}

type AppRunner struct {
	App *go_frame.App
	//KafkaMq   *mq.KafkaConsumer
	kafkaMq   mq.MQHandler
	WFStarter workflow.WFStarter
	Callbacks *callbacks.Transports
}

func NewAppRunner(app *go_frame.App,
	//kafkaMq *mq.KafkaConsumer,
	kafkaMq mq.MQHandler,
	cs *callbacks.Transports,
	wfs workflow.WFStarter,
) *AppRunner {
	return &AppRunner{App: app,
		//KafkaMq:   kafkaMq,
		kafkaMq:   kafkaMq,
		Callbacks: cs,
		WFStarter: wfs,
	}
}

func (a *AppRunner) Register() {
	a.Callbacks.Register()
	//a.KafkaMq.Registers()
	a.kafkaMq.MQRegister()
}

func (a *AppRunner) Run() error {
	a.Register()
	return a.App.Run()
}

func ToTransportServer(hs *rest.Server, formViewServer *formView.Server) []transport.Server {
	return []transport.Server{hs, formViewServer}
}
