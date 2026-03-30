package main

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/task_center/controller"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	goFrame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport"
)

func newApp(hss []transport.Server, ctrl_woa *controller.WorkOrderAlarmController) *goFrame.App {
	hss = append(hss, ctrl_woa)
	return goFrame.New(
		goFrame.Name(Name),
		goFrame.Server(hss...),
	)
}

type AppRunner struct {
	App    *goFrame.App
	Common *driver.CommonService
	wfs    wf_go.WFStarter
}

func (a AppRunner) Run() error {
	//初始化公共依赖
	if err := a.wfs.Start(); err != nil {
		return err
	}

	a.Common.InitCommonService()
	return a.App.Run()
}
