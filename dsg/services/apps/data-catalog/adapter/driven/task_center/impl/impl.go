package impl

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/task_center"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DrivenImpl struct {
	baseURL    string
	httpClient *http.Client
}

func NewDriven(httpClient *http.Client) task_center.Driven {
	return &DrivenImpl{
		baseURL:    base.Service.TaskCenterHost,
		httpClient: httpClient,
	}
}

func (d *DrivenImpl) GetComprehensionTemplateRelation(ctx context.Context, req *task_center.GetComprehensionTemplateRelationReq) (*task_center.GetComprehensionTemplateRelationRes, error) {
	errorMsg := "TaskCenterDriven GetComprehensionTemplateRelation "
	urlStr := d.baseURL + "/api/internal/task-center/v1/data-comprehension-template"
	res := &task_center.GetComprehensionTemplateRelationRes{}
	log.Infof(errorMsg+" url:%s \n ", urlStr)
	err := base.CallInternal(ctx, d.httpClient, errorMsg, http.MethodPost, urlStr, req, res)
	if err != nil {
		return res, err
	}
	return res, nil
}

func (d *DrivenImpl) GetSandboxDetail(ctx context.Context, req *task_center.GetSandboxDetailReq) (*task_center.GetSandboxDetailRes, error) {
	errorMsg := "TaskCenterDriven GetSandboxDetail "
	urlStr := fmt.Sprintf("%s/api/internal/task-center/v1/sandbox/detail/%s", d.baseURL, req.ID)
	res := &task_center.GetSandboxDetailRes{}
	log.Infof(errorMsg+" url:%s \n ", urlStr)
	err := base.CallInternal(ctx, d.httpClient, errorMsg, http.MethodGet, urlStr, nil, res)
	if err != nil {
		return res, err
	}
	return res, nil
}
