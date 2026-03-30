package impl

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"testing"
	"text/tabwriter"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

func TestSearchDataResource(t *testing.T) {
	// 准备测试使用的 basic-search 配置
	host := os.Getenv("TEST_BASIC_SEARCH_HOST")
	if host == "" {
		t.Skip("TEST_BASIC_SEARCH_HOST is empty")
	}
	settings.GetConfig().BasicSearchHost = host

	c := &http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}}

	r := &repo{httpclient: httpclient.NewMiddlewareHTTPClient(c)}

	param := &basic_search.SearchDataResourceRequest{
		Size: 3,
		Type: []string{"data_view"},
	}

	resp, err := r.SearchDataResource(context.Background(), param)
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("total count: %d", resp.TotalCount)
	LogEntryAsTable(t, resp.Entries)

	t.Fail()
}

func LogEntryAsTable(t *testing.T, entries []basic_search.SearchDataResourceResponseEntry) {
	t.Helper()
	buf := &bytes.Buffer{}
	w := tabwriter.NewWriter(buf, 0, 0, 1, ' ', tabwriter.Debug)
	fmt.Fprint(w, "TYPE\tID\tSUBJECT\tDEPARTMENT\n")
	for _, e := range entries {
		fmt.Fprintf(w, "%v\t%v\t%v\n", e.Type, e.ID, e.CateInfos)
	}
	w.Flush()
	t.Logf("entries:\n%s", buf)
}
