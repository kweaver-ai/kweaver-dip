package impl

import (
	"os"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	TestEnvNameDSN = "TEST_DSN"
)

func mustLoadEnv(t *testing.T, name string) string {
	t.Helper()
	v := os.Getenv(name)
	if v == "" {
		t.Skipf("env %q is empty", name)
	}
	return v
}

func mustGormDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(mysql.Open(mustLoadEnv(t, TestEnvNameDSN)))
	if err != nil {
		t.Skipf("create gorm.DB fail: %v", err)
	}
	return db
}

func TestMain(m *testing.M) {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})
	m.Run()
}
