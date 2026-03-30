package main

import (
	"flag"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/initialization"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process/rule"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process/template"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
)

var (
	Addr     string
	confPath string
	startCDC string
)

func init() {
	flag.StringVar(&confPath, "confPath", "cmd/server/config/", "config path, eg: -conf config.yaml")
	flag.StringVar(&Addr, "addr", ":8134", "config path, eg: -addr 0.0.0.0:8134")
	flag.StringVar(&startCDC, "daemon", "false", "start cdc service, eg: --daemon true")
}

// @title			data-subject
// @version		1.0.0
// @description	AnyFabric data subject
// @BasePath		/api/data-subject/v1
func main() {
	flag.Parse()
	config.InitSources(confPath)

	var bc my_config.Bootstrap = config.Scan[my_config.Bootstrap]()
	//模板配置
	template.TemplateStruct = config.Scan[template.Templates]()
	//解析规则配置
	rule.LineRulesStruct = config.Scan[rule.LineRules]()
	// 初始化AR日志+Tracer
	initialization.InitTraceAndLogger(&bc)
	defer initialization.Release()

	if strings.EqualFold(startCDC, "true") {
		start(&bc)
		return
	}

	//初始化验证器配置
	if err := form_validator.SetupValidator(); err != nil {
		panic(err)
	}

	app, cleanup, err := InitApp(&bc)
	if err != nil {
		panic(err)
	}
	defer cleanup()

	// start and wait for stop signal
	if err = app.Run(); err != nil {
		panic(err)
	}
}
