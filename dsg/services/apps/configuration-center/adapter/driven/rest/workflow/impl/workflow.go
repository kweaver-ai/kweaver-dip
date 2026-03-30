package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/workflow"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type Workflow struct {
	// API endpoint
	base string

	// HTTP Client
	client *http.Client
}

func NewWorkflow(client *http.Client) workflow.Workflow {
	return &Workflow{
		base:   settings.ConfigInstance.Config.DepServices.WorkFlowRestHost,
		client: client,
	}
}

func (w Workflow) ProcessDefinitionGet(ctx context.Context, procDefKey string) (res *workflow.ProcessDefinitionGetRes, err error) {
	params := map[string]string{
		"procDefKey": procDefKey,
	}
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.ObtainToken(ctx)).
		SetPathParams(params).
		Get(w.base + "/api/workflow-rest/v1/process-definition/{procDefKey}")
	// Get("http://10.102.138.40:9800" + "/api/workflow-rest/v1/process-definition/{procDefKey}")
	if err != nil {
		log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, resp.String())
	}

	res = &workflow.ProcessDefinitionGetRes{}
	err = resp.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, err.Error())
	}

	return res, nil
}

func (w Workflow) GetList(ctx context.Context, target workflow.WorkflowListType, auditTypes []string, offset, limit int) (*workflow.AuditResponse, error) {
	var err error
	values := url.Values{
		"type":   auditTypes,
		"offset": []string{fmt.Sprint((offset - 1) * limit)},
		"limit":  []string{fmt.Sprint(limit)},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/api/doc-audit-rest/v1/doc-audit/%s?%s", "http://doc-audit-rest:9800", target, values.Encode()), http.NoBody)
	if err != nil {
		return nil, err
	}
	fmt.Println(req)
	req.Header.Set("Authorization", ctx.Value(interception.Token).(string))

	resp, err := w.client.Do(req)
	if err != nil {
		return nil, err
	}

	fmt.Println(resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		fmt.Println("start.........................aa")
		return nil, err
	}

	defer resp.Body.Close()
	buf, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	respa := workflow.AuditResponse{}
	if err = json.Unmarshal(buf, &respa); err != nil {
		return nil, err
	}
	return &respa, nil
}
