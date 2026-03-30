package log

import (
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

const appLoggerName = "data-application-gateway"
const requestLoggerName = "data-application-gateway_request"

var logger zapx.Logger
var logPath string

func InitProjectLogger() {
	logPath = settings.Instance.Log.LogPath
	logger = newProjectLogger(appLoggerName)
}

func newProjectLogger(loggerName string) zapx.Logger {
	//infoConfig := zapx.CoreConfig{
	//	RotateSize:   zapx.DefaultRotateSize,
	//	Destination:  fmt.Sprintf("%s/info.log", logPath),
	//	OutputFormat: zapx.JsonFormat,
	//	LogLevel:     zapx.DefaultLogLevelString,
	//}
	//errorConfig := zapx.CoreConfig{
	//	RotateSize:   zapx.DefaultRotateSize,
	//	Destination:  fmt.Sprintf("%s/error.log", logPath),
	//	OutputFormat: zapx.JsonFormat,
	//	LogLevel:     zapx.DefaultLogLevelString,
	//}
	//consoleConfig := zapx.CoreConfig{
	//	RotateSize:   zapx.DefaultRotateSize,
	//	Destination:  zapx.ConsoleDestination,
	//	OutputFormat: zapx.ConsoleFormat,
	//	LogLevel:     zapx.DefaultLogLevelString,
	//}
	options := zapx.Options{
		Name:         loggerName,
		EnableCaller: true,
		Development:  true,
		//CoreConfigs:     []zapx.CoreConfig{infoConfig, errorConfig, consoleConfig},
	}

	return options.ZapLogger()
}
