package impl

import (
	"testing"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestMain(m *testing.M) {
	// Initialize the logger, otherwise logging will panic.
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})

	m.Run()
}
