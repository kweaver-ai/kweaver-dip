package impl

import (
	"bytes"
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data_exploration"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"encoding/json"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
	"io"
	"net/http"
)

type DataExploration struct {
	baseURL    string
	HttpClient *http.Client
}

func NewDataExploration(conf *my_config.Bootstrap, httpClient *http.Client) data_exploration.DrivenDataExploration {
	return &DataExploration{
		baseURL:    conf.DepServices.DataExploreHost,
		HttpClient: httpClient,
	}
}

// CreateTask 添加探查任务配置
func (d *DataExploration) CreateTask(ctx context.Context, req io.Reader) (*data_exploration.ExploreJobResp, error) {
	drivenMsg := "DrivenDataExploration CreateTask "
	urlStr := fmt.Sprintf("%s/api/internal/data-exploration-service/v1/task", d.baseURL)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationCreateTaskError, err.Error())
	}
	//request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationCreateTaskError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationCreateTaskError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res data_exploration.ExploreJobResp
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DataExplorationCreateTaskError, err.Error())
		}
		log.Infof(drivenMsg+"res task_id:%v,version :%v", res.TaskID, res.Version)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationCreateTaskError, resp.StatusCode)
		}
	}
}

// UpdateTask 更新探查任务配置
func (d *DataExploration) UpdateTask(ctx context.Context, req io.Reader, id string) (*data_exploration.ExploreJobResp, error) {
	drivenMsg := "DrivenDataExploration UpdateTask "
	urlStr := fmt.Sprintf("%s/api/internal/data-exploration-service/v1/task/%s", d.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodPut, urlStr, req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationUpdateTaskError, err.Error())
	}
	//request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationUpdateTaskError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationUpdateTaskError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res data_exploration.ExploreJobResp
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DataExplorationUpdateTaskError, err.Error())
		}
		log.Infof(drivenMsg+"res task_id:%v,version :%v", res.TaskID, res.Version)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationUpdateTaskError, resp.StatusCode)
		}
	}
}

// 获取数据探查任务配置
func (d *DataExploration) GetTask(ctx context.Context, id string) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetTask "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/task/%s", d.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetTaskError, resp.StatusCode)
		}
	}
}

// 按表或任务获取数据探查报告
func (d *DataExploration) GetReport(ctx context.Context, id string, version *int32) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetReport "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/report?task_id=%s", d.baseURL, id)
	if version != nil {
		urlStr = fmt.Sprintf("%s&task_version=%d", urlStr, *version)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
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

// 获取字段数据探查报告
func (d *DataExploration) GetFieldReport(ctx context.Context, id, fieldName string, dataType string) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetReport "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/report/field?task_id=%s&field_name=%s&field_type=%s", d.baseURL, id, fieldName, dataType)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
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

// 获取数据探查项目配置
func (d *DataExploration) GetRuleList(ctx context.Context) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetRuleList "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/projects", d.baseURL)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetRuleListError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetRuleListError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetRuleListError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetRuleListError, resp.StatusCode)
		}
	}
}

// 获取探查作业质量总评分数据
func (d *DataExploration) GetScore(ctx context.Context, id string) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetScore "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/reports?task_id=%s&offset=1&limit=10&direction=desc&sort=f_created_at", d.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetScoreError, resp.StatusCode)
		}
	}
}

// 获取探查作业质量总评分数据
func (d *DataExploration) GetThirdPartyScore(ctx context.Context, id string) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetScore "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/third-party-reports?table_id=%s&offset=1&limit=10&direction=desc&sort=f_created_at", d.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetScoreError, resp.StatusCode)
		}
	}
}

// 获取任务状态
func (d *DataExploration) GetStatus(ctx context.Context, catalog, schema, taskId string) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetStatus "
	var urlStr string
	if taskId != "" {
		urlStr = fmt.Sprintf("%s/api/internal/data-exploration-service/v1/task/status?dv_task_id=%s", d.baseURL, taskId)
	} else if catalog != "" && schema != "" {
		urlStr = fmt.Sprintf("%s/api/internal/data-exploration-service/v1/task/status?ve_catalog=%s&schema=%s", d.baseURL, catalog, schema)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetStatusError, err.Error())
	}
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetStatusError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetStatusError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetStatusError, resp.StatusCode)
		}
	}
}

// 获取视图任务状态
func (d *DataExploration) GetFormStatus(ctx context.Context, req *data_exploration.TableTaskStatusReq) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetFormStatus "
	urlStr := fmt.Sprintf("%s/api/internal/data-exploration-service/v1/task/status", d.baseURL)

	buf, err := json.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal data-exploration-service获取视图任务状态请求参数失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(buf))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetStatusError, err.Error())
	}
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetStatusError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetStatusError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetStatusError, resp.StatusCode)
		}
	}
}

// 执行探查
func (d *DataExploration) StartExplore(ctx context.Context, req io.Reader) ([]byte, error) {
	drivenMsg := "DrivenDataExploration StartExplore "
	urlStr := fmt.Sprintf("%s/api/internal/data-exploration-service/v1/reports", d.baseURL)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationStartExploreError, err.Error())
	}
	//request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationStartExploreError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationStartExploreError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationStartExploreError, resp.StatusCode)
		}
	}
}

func (d *DataExploration) DeleteTask(ctx context.Context, id string) error {
	drivenMsg := "DrivenDataExploration GetTask "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/explore-task/%s", d.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodDelete, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DataExplorationDeleteTaskError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := d.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DataExplorationDeleteTaskError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DataExplorationDeleteTaskError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return errorcode.Desc(my_errorcode.DataExplorationDeleteTaskError, resp.StatusCode)
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

func (d *DataExploration) GetThirdReport(ctx context.Context, tableId string, version *int32) ([]byte, error) {
	drivenMsg := "DrivenDataExploration GetThirdReport "
	urlStr := fmt.Sprintf("%s/api/data-exploration-service/v1/third-party-report?table_id=%s", d.baseURL, tableId)
	if version != nil {
		urlStr = fmt.Sprintf("%s&task_version=%d", urlStr, *version)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
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

func (d *DataExploration) GetReports(ctx context.Context, req io.Reader) ([]byte, error) {
	drivenMsg := "DrivenDataExploration StartExplore "
	urlStr := fmt.Sprintf("%s/api/internal/data-exploration-service/v1/report", d.baseURL)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, req)
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
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DataExplorationGetReportError, resp.StatusCode)
		}
	}
}
