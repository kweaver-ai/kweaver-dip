package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_exploration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type dataExploration struct {
	baseURL string
	client  *http.Client
}

func NewDataExploration(client *http.Client) data_exploration.DataExploration {
	return &dataExploration{
		client:  client,
		baseURL: settings.ConfigInstance.DepServices.DEHost,
	}
}

func (d *dataExploration) GetReportList(ctx context.Context, req *data_exploration.ReportListReq) (*data_exploration.ReportListResp, error) {
	errorMsg := "DataExploration GetReportList "
	urlStr := fmt.Sprintf("http://%s/api/internal/data-exploration-service/v1/reports?sort=f_updated_at&direction=desc&limit=%d&offset=%d", d.baseURL, *req.Limit, *req.Offset)
	if req.ThirdParty {
		urlStr = fmt.Sprintf("%s&third_party=true", urlStr)
	}
	if req.CatalogName != "" {
		urlStr = fmt.Sprintf("%s&catalog_name=%s", urlStr, req.CatalogName)
	}
	if req.Keyword != "" {
		urlStr = fmt.Sprintf("%s&keyword=%s", urlStr, req.Keyword)
	}
	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	resp, err := d.client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDataExplorationUrlError)
	}
	//延时关闭
	defer resp.Body.Close()

	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	log.WithContext(ctx).Info(string(body))
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.TaskDataExplorationUrlError)
		} else {
			return nil, errorcode.Desc(errorcode.TaskDataExplorationQueryError)
		}
	}
	res := &data_exploration.ReportListResp{}
	if err := json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.TaskDataExplorationJsonError, err.Error())
	}
	return res, nil
}

func (d *dataExploration) CreateThirdPartyTaskConfig(ctx context.Context, req *data_exploration.ThirdPartyTaskConfigReq) (*data_exploration.TaskConfigResp, error) {
	errorMsg := "DataExploration GetReportList "
	urlStr := fmt.Sprintf("http://%s/api/internal/data-exploration-service/v1/third-party-task", d.baseURL)
	buf, err := json.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal data-exploration-service创建/编辑探查作业请求参数失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.TaskDataExplorationJsonError, err)
	}
	request, _ := http.NewRequest(http.MethodPost, urlStr, bytes.NewReader(buf))
	resp, err := d.client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDataExplorationUrlError)
	}
	//延时关闭
	defer resp.Body.Close()

	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	log.WithContext(ctx).Info(string(body))
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.TaskDataExplorationUrlError)
		} else {
			return nil, errorcode.Desc(errorcode.TaskDataExplorationJsonError)
		}
	}
	res := &data_exploration.TaskConfigResp{}
	if err := json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.TaskDataExplorationJsonError, err.Error())
	}
	return res, nil
}
