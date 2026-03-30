package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/metadata"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
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

type Metadata struct {
	baseURL    string
	HttpClient *http.Client
}

func NewMetadata(conf *my_config.Bootstrap, httpClient *http.Client) metadata.DrivenMetadata {
	return &Metadata{
		baseURL:    conf.DepServices.MetadataHost,
		HttpClient: httpClient,
	}
}

// GetDataTables 获取数据表
func (m *Metadata) GetDataTables(ctx context.Context, req *metadata.GetDataTablesReq) ([]*metadata.GetDataTablesDataRes, error) {
	drivenMsg := "DrivenMetadata GetDataTables "
	urlStr := fmt.Sprintf("%s/api/metadata-manage/v1/table?ids=%s&offset=%d&limit=1000", m.baseURL, req.Ids, req.Offset)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTablesError, err.Error())
	}
	request.Header.Set("Authorization", util.ObtainToken(ctx))
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTablesError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTablesError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res metadata.GetDataTablesRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetDataTablesError, err.Error())
		}
		for _, data := range res.Data {
			if data.AdvancedParams != "" {
				if err := json.Unmarshal([]byte(data.AdvancedParams), &data.AdvancedDataSlice); err != nil {
					log.WithContext(ctx).Error(err.Error())
				}
			}
		}
		log.Infof(drivenMsg+"res  msg : %v ,code:%v", res.Description, res.Code)
		return res.Data, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.GetDataTablesError, resp.StatusCode)
		}
	}
}

// GetDataTableDetail 表详情，表字段
func (m *Metadata) GetDataTableDetail(ctx context.Context, req *metadata.GetDataTableDetailReq) (*metadata.GetDataTableDetailRes, error) {
	drivenMsg := "DrivenMetadata GetDataTableDetail "

	urlStr := fmt.Sprintf("%s/api/metadata-manage/v1/datasource/%d/schema/%s/table/%s",
		m.baseURL, req.DataSourceId, req.SchemaId, req.TableId)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailError, err.Error())
	}
	request.Header.Set("Authorization", util.ObtainToken(ctx))
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res metadata.GetDataTableDetailRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetDataTableDetailError, err.Error())
		}
		log.Infof(drivenMsg+"res  msg : %v ,code:%v", res.Description, res.Code)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.GetDataTableDetailError, resp.StatusCode)
		}
	}
}
func (m *Metadata) GetDataTableDetailBatch(ctx context.Context, req *metadata.GetDataTableDetailBatchReq) (*metadata.GetDataTableDetailBatchRes, error) {
	drivenMsg := "DrivenMetadata GetDataTableDetailBatch "

	urlStr := fmt.Sprintf("%s/api/metadata-manage/v1/table_and_column?limit=%d&offset=%d&checkField=true&data_source_id=%d&schema_id=%s",
		m.baseURL, req.Limit, req.Offset, req.DataSourceId, req.SchemaId)

	log.Infof(drivenMsg+" url:%s \n ", urlStr)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailBatchError, err.Error())
	}
	request.Header.Set("Authorization", util.ObtainToken(ctx))
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailBatchError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailBatchError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res metadata.GetDataTableDetailBatchRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetDataTableDetailBatchError, err.Error())
		}
		if err = res.SerializeAdvancedParams(); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" SerializeAdvancedParams error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetDataTableDetailBatchError, err.Error())
		}
		log.Infof(drivenMsg+"res  msg : %v ,code:%v", res.Description, res.Code)
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.GetDataTableDetailBatchError, resp.StatusCode)
		}
	}
}
func (m *Metadata) DoCollect(ctx context.Context, req *metadata.DoCollectReq) (*metadata.DoCollectRes, error) {
	drivenMsg := "DrivenMetadata DoCollect "

	urlStr := fmt.Sprintf("%s/api/metadata-manage/v1/task/fillMetaDataByVirtual/%d", m.baseURL, req.DataSourceId)
	log.Infof(drivenMsg+" url:%s \n %+v", urlStr, req.DataSourceId)

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
	}
	request.Header.Set("Authorization", util.ObtainToken(ctx))
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res metadata.DoCollectRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
		}
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DoCollectFailure, resp.StatusCode)
		}
	}
}

func (m *Metadata) GetTasks(ctx context.Context, req *metadata.GetTasksReq) (*metadata.GetTasksRes, error) {
	drivenMsg := "DrivenMetadata GetTasks "

	urlStr := fmt.Sprintf("%s/api/metadata-manage/v1/task?keyword=%s", m.baseURL, req.Keyword)

	log.Infof(drivenMsg+" url:%s \n %+v", urlStr, req.Keyword)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
	}
	request.Header.Set("Authorization", util.ObtainToken(ctx))
	resp, err := m.HttpClient.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res metadata.GetTasksRes
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DoCollectFailure, err.Error())
		}
		return &res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.DoCollectFailure, resp.StatusCode)
		}
	}
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.DrivenMetadataError, err.Error())
	}
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}
