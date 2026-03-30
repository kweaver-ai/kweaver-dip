package main

import (
	assessmentv1 "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/assessment/v1"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics/impl"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	af_go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

type AppRunner struct {
	App                  *af_go_frame.App
	Callbacks            *callbacks.Transports
	wfs                  workflow.WFStarter
	kafkaConsumer        *kafka.MqHandler
	statisticsUseCase    *impl.UseCase            // 新增
	AssessmentController *assessmentv1.Controller // 新增：用于定时任务
}

func newApp(hs *rest.Server) *af_go_frame.App {
	return af_go_frame.New(
		af_go_frame.Name(Name),
		af_go_frame.Server(hs),
	)
}

func NewAppRunner(
	app *af_go_frame.App,
	cs *callbacks.Transports,
	wfs workflow.WFStarter,
	kc *kafka.MqHandler,
	statisticsUseCase *impl.UseCase,
	assessmentController *assessmentv1.Controller,
) *AppRunner {
	return &AppRunner{
		App:                  app,
		Callbacks:            cs,
		wfs:                  wfs,
		kafkaConsumer:        kc,
		statisticsUseCase:    statisticsUseCase,
		AssessmentController: assessmentController,
	}
}

func (a *AppRunner) Run() error {
	a.kafkaConsumer.MQRegister()
	//a.Callbacks.Register()
	return a.App.Run()
}
