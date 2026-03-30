package impl

import (
	"testing"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestMain(m *testing.M) {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})
	m.Run()
}
