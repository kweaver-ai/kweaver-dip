package initialization

import (
	"context"

	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
)

type Defer func()

var fs []Defer

func Release() {
	for _, f := range fs {
		f()
	}
}
func add(f Defer) {
	fs = append(fs, f)
}

func InitTraceAndLogger(bc *my_config.Bootstrap) {
	InitAppTraceAndLog(bc)
}

func InitAppTraceAndLog(bc *my_config.Bootstrap) {
	tracerProvider := InitTraceAndLog(bc)
	add(func() {
		if err := tracerProvider.Shutdown(context.Background()); err != nil {
			panic(err)
		}
	})
}
