package impl

import (
	"context"
	"fmt"
	"io"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_exploration"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"go.uber.org/zap"
)

type DataExploration struct {
	HttpClient *http.Client
}

func NewDataExploration(httpClient *http.Client) data_exploration.DrivenDataExploration {
	return &DataExploration{
		HttpClient: httpClient,
	}
}

func (d *DataExploration) GetThirdReport(ctx context.Context, tableId string, version *int32) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetThirdReport "
	urlStr := fmt.Sprintf("%s/api/internal/data-exploration-service/v1/third-party-report?table_id=%s", settings.GetConfig().DataExploreHost, tableId)
	if version != nil {
		urlStr = fmt.Sprintf("%s&task_version=%d", urlStr, *version)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err.Error())
	}
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest {
			return nil, nil
		} else if resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetReportError, resp.StatusCode)
		}
	}
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DrivenDataExploration, err.Error())
	}
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}
