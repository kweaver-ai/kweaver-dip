package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	jsoniter "github.com/json-iterator/go"
	data_view "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type dataView struct {
	baseURL string
	client  *http.Client
}

func NewDataView(client *http.Client) data_view.DataView {
	return &dataView{
		client:  client,
		baseURL: settings.ConfigInstance.DepServices.DVHost,
	}
}

// FinishProject 同步数据表视图任务完成
func (d *dataView) FinishProject(ctx context.Context, taskIds []string) error {
	errorMsg := "DataView FinishProject "
	urlStr := fmt.Sprintf("http://%s/api/internal/data-view/v1/task-project", d.baseURL)

	jsonReq, err := jsoniter.Marshal(struct {
		TaskIDs []string `json:"task_id" form:"task_id" `
	}{
		TaskIDs: taskIds,
	})
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" jsoniter.Marshal error", zap.Error(err))
		return errorcode.Detail(errorcode.FinishProjectError, err.Error())
	}
	log.Infof("url:%s \n %+v", urlStr, string(jsonReq))

	request, _ := http.NewRequest(http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	resp, err := d.client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(errorcode.FinishProjectError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(errorMsg+"io.ReadAll", zap.Error(err))
		return errorcode.Detail(errorcode.FinishProjectError, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeBody)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return errorcode.Detail(errorcode.FinishProjectError, err.Error())
			}
			log.Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return errorcode.Desc(errorcode.FinishProjectError)
		}
	}
	return nil
}

func (d *dataView) GetList(ctx context.Context, req *data_view.GetListReq) ([]*data_view.FormView, error) {
	errorMsg := "DataView GetList "
	urlStr := fmt.Sprintf("http://%s/api/data-view/v1/form-view", d.baseURL)
	if req != nil {
		if req.FormViewIdsString != "" {
			urlStr = fmt.Sprintf("%s?form_view_ids=%s", urlStr, req.FormViewIdsString)
		}
	}
	token, err := user_util.ObtainToken(ctx)
	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request.Header.Set("Authorization", token)
	resp, err := d.client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDataViewUrlError)
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
			return nil, errorcode.Desc(errorcode.TaskDataViewUrlError)
		} else {
			return nil, errorcode.Desc(errorcode.TaskDataViewQueryError)
		}
	}
	res := data_view.GetListResp{}
	if err := json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.TaskDataViewJsonError, err.Error())
	}
	return res.Entries, nil
}

// GetViewByTechnicalNameAndHuaAoId 通过技术名称和华奥ID查询视图
func (d *dataView) GetViewByTechnicalNameAndHuaAoId(ctx context.Context, req *data_view.GetViewByTechnicalNameAndHuaAoIdReq) (*data_view.GetViewFieldsResp, error) {
	errorMsg := "DataView GetViewByTechnicalNameAndHuaAoId "
	urlStr := fmt.Sprintf("http://%s/api/data-view/v1/form-view/by-technical-name-and-hua-ao-id?technical_name=%s&hua_ao_id=%s",
		d.baseURL, req.TechnicalName, req.HuaAoID)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		log.Error(errorMsg+"user_util.ObtainToken error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.TaskDataViewUrlError, err.Error())
	}

	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request.Header.Set("Authorization", token)
	resp, err := d.client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDataViewUrlError)
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
			return nil, errorcode.Desc(errorcode.TaskDataViewUrlError)
		} else {
			return nil, errorcode.Desc(errorcode.TaskDataViewQueryError)
		}
	}
	res := &data_view.GetViewFieldsResp{}
	if err := json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.TaskDataViewJsonError, err.Error())
	}
	return res, nil
}

// GetWorkOrderExploreProgress 获取质量检测工单对应探查任务处理进度
func (d *dataView) GetWorkOrderExploreProgress(ctx context.Context, workOrderIDs []string) (*data_view.WorkOrderExploreProgressResp, error) {
	errorMsg := "DataView GetWorkOrderExploreProgress "
	urlStr := fmt.Sprintf("http://%s/api/internal/data-view/v1/explore-task/progress?work_order_ids=%s",
		d.baseURL, strings.Join(workOrderIDs, ","))

	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	resp, err := d.client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDataViewUrlError)
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
			return nil, errorcode.Desc(errorcode.TaskDataViewUrlError)
		} else {
			return nil, errorcode.Desc(errorcode.TaskDataViewQueryError)
		}
	}
	res := &data_view.WorkOrderExploreProgressResp{}
	if err := json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.TaskDataViewJsonError, err.Error())
	}
	return res, nil
}
