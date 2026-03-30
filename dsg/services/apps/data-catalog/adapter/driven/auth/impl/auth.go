package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type repo struct {
	httpclient httpclient.HTTPClient
}

func NewRepo(httpclient httpclient.HTTPClient) auth.Repo {
	return &repo{httpclient: httpclient}
}

func (r *repo) GetAccess(ctx context.Context, objectType []string, subjectId, subjectType string) (res *auth.GetAccessResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() {
		trace.TelemetrySpanEnd(span, err)
	}()
	url := settings.GetConfig().AuthServiceHost + "/api/auth-service/v1/subject/objects?object_type=%s&subject_id=%s&subject_type=%s"
	authUrl := fmt.Sprintf(url, strings.Join(objectType, ","), subjectId, subjectType)
	headers := map[string][]string{
		"Content-Time":  {"application/json"},
		"Authorization": {ctx.Value(interception.Token).(string)},
	}

	request, _ := http.NewRequestWithContext(ctx, http.MethodGet, authUrl, http.NoBody)
	request.Header = headers
	response, err := trace.NewOtelHttpClient().Do(request)
	log.WithContext(ctx).Infof("get access url: %s", authUrl)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get access ids, err info: %v", err.Error())
		return nil, err
	}
	defer response.Body.Close()
	bytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read bytes from response body, err info: %v", err.Error())
		return nil, err
	}

	if err := json.Unmarshal(bytes, &res); err != nil {
		log.WithContext(ctx).Errorf("failed to unmarshal res from bytes, err info: %v", err.Error())
		return nil, err
	}
	return
}
