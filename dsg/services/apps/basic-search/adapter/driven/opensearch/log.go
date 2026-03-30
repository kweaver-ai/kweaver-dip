package opensearch

import (
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/olivere/elastic/v7"
)

type loggerFunc func(string, ...any)

func (f loggerFunc) Printf(msg string, args ...any) {
	f(msg, args)
}

var (
	esLogger log.Logger

	traceLog elastic.Logger
	infoLog  elastic.Logger
	errorLog elastic.Logger
)

func getTraceLog() elastic.Logger {
	if traceLog != nil {
		return traceLog
	}

	if !settings.GetConfig().OpenSearchConf.Debug {
		return nil
	}

	logger := log.WithName("elastic_trace_log")
	traceLog = loggerFunc(func(s string, a ...any) {
		logger.Infof(s, a)
	})

	return traceLog
}

func getInfoLog() elastic.Logger {
	if infoLog != nil {
		return infoLog
	}

	if esLogger == nil {
		esLogger = log.WithName("elastic_log")
	}

	infoLog = loggerFunc(func(s string, a ...any) {
		esLogger.Infof(s, a)
	})

	return infoLog
}

func getErrorLog() elastic.Logger {
	if errorLog != nil {
		return errorLog
	}

	if esLogger == nil {
		esLogger = log.WithName("elastic_log")
	}

	errorLog = loggerFunc(func(s string, a ...any) {
		esLogger.Errorf(s, a)
	})

	return errorLog
}
