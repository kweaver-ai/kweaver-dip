package microservice

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"net/http"
	"os"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/interception"
)

func TestConfigurationCenterDepartmentGet(t *testing.T) {
	// testdata
	var (
		host        = loadRequiredEnv(t, "TEST_HOST")
		bearerToken = loadRequiredEnv(t, "TEST_BEARER_TOKEN")
		id          = loadRequiredEnv(t, "TEST_ID")
	)

	ctx := context.WithValue(context.Background(), interception.Token, bearerToken)

	settings.Instance.Services.ConfigurationCenter = host

	client := util.NewHTTPClient(&http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}})

	repo := &configurationCenterRepo{
		baseURL:    host,
		httpclient: client,
	}

	res, err := repo.DepartmentGet(ctx, id)
	if err != nil {
		t.Fatal(err)
	}

	if resJSON, err := json.MarshalIndent(res, "", "  "); err != nil {
		t.Fatal(err)
	} else {
		t.Logf("Department: %s", resJSON)
	}
}

func loadRequiredEnv(t *testing.T, key string) string {
	t.Helper()

	v, ok := os.LookupEnv(key)
	if !ok {
		t.Skipf("required env %q is missing", key)
	}
	return v
}
