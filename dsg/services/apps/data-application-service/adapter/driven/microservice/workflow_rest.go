package microservice

import (
	"context"
	"errors"
	"time"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ProcessDefinitionGetRes struct {
	Id             string      `json:"id"`
	Key            string      `json:"key"`
	Name           string      `json:"name"`
	Type           string      `json:"type"`
	TypeName       string      `json:"type_name"`
	CreateTime     time.Time   `json:"create_time"`
	CreateUserName string      `json:"create_user_name"`
	TenantId       string      `json:"tenant_id"`
	Description    interface{} `json:"description"`
	Effectivity    int         `json:"effectivity"`
}

type WorkflowRestRepo interface {
	ProcessDefinitionGet(ctx context.Context, procDefKey string) (res *ProcessDefinitionGetRes, err error)
}

type workflowRestRepo struct{}

func NewWorkflowRestRepo() WorkflowRestRepo {
	return &workflowRestRepo{}
}

func (w workflowRestRepo) ProcessDefinitionGet(ctx context.Context, procDefKey string) (res *ProcessDefinitionGetRes, err error) {
	params := map[string]string{
		"procDefKey": procDefKey,
	}

	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetPathParams(params).
		Get(settings.Instance.Services.WorkflowRest + "/api/workflow-rest/v1/process-definition/{procDefKey}")
	if err != nil {
		log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &ProcessDefinitionGetRes{}
	err = resp.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, nil
}
