package main

import (
	"context"
	"strconv"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/impl"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/configuration"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	goFrame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type MainArgs struct {
	Name       string //服务名称
	Version    string //系统版本
	ConfigPath string //配置文件地址
	Addr       string //监听地址
}

type AppRunner struct {
	App       *goFrame.App
	Mq        impl.MQ
	Callbacks *callbacks.Transports
	wfs       wf_go.WFStarter
}

func newApp(hs *rest.Server, wf workflow.WorkflowInterface) *goFrame.App {
	return goFrame.New(
		goFrame.Name(arg.Name),
		goFrame.Server(hs, &wrappedWorkflow{wf: wf}),
	)
}
func NewAppRunner(
	app *goFrame.App,
	mq impl.MQ,
	cs *callbacks.Transports,
	wfs wf_go.WFStarter,
) *AppRunner {
	return &AppRunner{
		App:       app,
		Mq:        mq,
		Callbacks: cs,
		wfs:       wfs,
	}
}

func NewAppRunnerWithInit(
	app *goFrame.App,
	mq impl.MQ,
	cs *callbacks.Transports,
	wfs wf_go.WFStarter,
	configurationCase domain.ConfigurationCase,
) (*AppRunner, error) {

	if err := initUsingConfig(configurationCase); err != nil {
		return nil, err
	}

	return NewAppRunner(app, mq, cs, wfs), nil
}

func (a *AppRunner) Run() error {
	// start consumer MQ
	a.Callbacks.Register()
	if err := a.wfs.Start(); err != nil {
		return err
	}
	return a.App.Run()
}

func initUsingConfig(configurationCase domain.ConfigurationCase) error {
	ctx := context.Background()

	usingStr := settings.ConfigInstance.Config.Using
	if usingStr == "" {
		return nil
	}

	usingValue, err := strconv.Atoi(usingStr)
	if err != nil {
		log.WithContext(ctx).Warn(
			"usingConfig using value is not a valid integer, skip setting",
			zap.String("using", usingStr),
			zap.Error(err),
		)
		return nil
	}

	req := &domain.PutDataUsingTypeReq{
		Using: usingValue,
	}

	if err := configurationCase.PutDataUsingType(ctx, req); err != nil {
		log.WithContext(ctx).Error(
			"usingConfig PutDataUsingType Error",
			zap.Error(err),
		)
		return err
	}

	log.WithContext(ctx).Info(
		"usingConfig successfully set using value from config",
		zap.Int("using", usingValue),
	)
	return nil
}
