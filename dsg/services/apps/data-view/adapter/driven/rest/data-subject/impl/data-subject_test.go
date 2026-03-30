package impl

import (
	"context"
	"crypto/tls"
	"net/http"
	"testing"

	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 用户身份认证所用的 token
var Token string

func TestDataSubject_GetSubjectList(t *testing.T) {
	// 初始化日志，否则调用 log.Info 等方法会失败 panic: runtime error: invalid
	// memory address or nil pointer dereference
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})

	ctx := context.Background()

	// 用户身份认证
	if Token == "" {
		t.Skip("缺少身份认证 token")
	}
	ctx = context.WithValue(ctx, interception.Token, Token)

	ds := &DataSubject{
		// 测试环境地址
		baseURL: "https://10.4.109.181",
		// 忽略 tls 验证错误，因为测试环境的这个证书的 CA 不被信任
		client: &http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}},
	}

	res, err := ds.GetSubjectList(ctx, "", "subject_domain_group,subject_domain")
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("total count: %d", res.TotalCount)
	for _, s := range res.Entries {
		t.Logf("data subject: id=%s, name=%s", s.Id, s.Name)
	}
}
