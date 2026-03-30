package microservice

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"testing"

	"github.com/imroc/req/v2"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 用户身份认证所用的 token
var token string

func TestMain(m *testing.M) {
	// 初始化日志，否则调用 log.Info 等方法会失败 panic: runtime error: invalid
	// memory address or nil pointer dereference
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})

	// 测试环境地址
	settings.Instance.Services.DataSubject = "https://10.4.109.181"
	settings.Instance.Services.DataView = "https://10.4.109.194"

	// 忽略 tls 验证错误，因为测试环境的证书不受信任
	req.DefaultClient().SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	m.Run()
}

// 获取用于测试的用户身份认证 token
func getTestingToken(t *testing.T) string {
	t.Helper()

	if token == "" {
		t.Skip("缺少用于测试的用户身份认证 token")
	}

	return token
}

// 获取包含身份认证的用于测试的 context.Context
func getTestContextWithToken(t *testing.T) context.Context {
	t.Helper()

	ctx := context.Background()

	ctx = context.WithValue(ctx, interception.Token, getTestingToken(t))

	return ctx
}

// 以 json 格式记录日志
func logAsJSON(t *testing.T, name string, value any, pretty bool) {
	t.Helper()

	buf := &bytes.Buffer{}

	encoder := json.NewEncoder(buf)
	if pretty {
		encoder.SetIndent("", "    ")
	}

	if err := encoder.Encode(value); err != nil {
		t.Error(err)
		return
	}

	t.Logf("%s: %s", name, buf)
}

func TestFoo(t *testing.T) {
	logAsJSON(t, "token", getTestingToken(t), true)
}
