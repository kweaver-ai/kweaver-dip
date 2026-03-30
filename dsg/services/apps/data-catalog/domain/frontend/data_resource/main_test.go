package data_resource

import (
	"os"
	"testing"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestMain(m *testing.M) {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})
	m.Run()
}

// 载入环境变量，如果环境变量为空则跳过测试用例
func LoadEnv(t *testing.T, name string) string {
	t.Helper()

	value := os.Getenv(name)
	if value == "" {
		t.Skipf("env %s is empty", name)
	}

	return value
}
