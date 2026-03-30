package server

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	goFrame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/transport"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

var arg = MainArgs{
	Name:    "af_configuration_center",
	Version: "1.0",
}

type MainArgs struct {
	Name       string //服务名称
	Version    string //系统版本
	ConfigPath string //配置文件地址
	Addr       string //监听地址
}

func newApp(ss []transport.Server) *goFrame.App {
	return goFrame.New(
		goFrame.Name(arg.Name),
		goFrame.Server(ss...),
	)
}

func toTransportServer(hs *rest.Server, explorationServer *exploration.Server) []transport.Server {
	return []transport.Server{hs, explorationServer}
}

type AppRunner struct {
	App       *goFrame.App
	Mq        mq.MQHandler
	Callbacks *callbacks.Transports
}
