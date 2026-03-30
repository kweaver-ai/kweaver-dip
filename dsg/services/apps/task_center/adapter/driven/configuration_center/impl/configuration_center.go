package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

const (
	//GetRolesInfoURL http://127.0.0.1:8133/api/configuration-center/v1/roles?role_ids=56efb357-7953-4582-8375-9e87c3f469d0,56efb357-7953-4582-8375-9e87c3f469d1
	GetRolesInfoURL = "http://%s/api/configuration-center/v1/roles/info?%s"

	//GetRemotePipelineInfoURL  http://127.0.0.1:8133/api/configuration-center/v1/flowchart-configurations/:uid/nodes?version_id=56efb357-7953-4582-8375-9e87c3f469d0
	GetRemotePipelineInfoURL = "http://%s/api/configuration-center/v1/flowchart-configurations/%s/nodes?version_id=%s"
	GetAlarmRuleURL          = "http://%s/api/configuration-center/v1/alarm-rule?types=%s"
)

type ConfigurationCenterCall struct {
	baseURL string
	client  *http.Client
}

func NewConfigurationCenterCall(client *http.Client) configuration_center.Call {
	return &ConfigurationCenterCall{
		client:  client,
		baseURL: settings.ConfigInstance.DepServices.CCHost,
	}
}

// GetRoleInfo get roles info
func (c *ConfigurationCenterCall) GetRoleInfo(ctx context.Context, roleId string) (*configuration_center.RoleInfo, error) {
	serviceName := "configuration-center"

	roleInfos, err := c.GetRolesInfo(ctx, []string{roleId})
	if err != nil {
		return nil, err
	}
	if len(roleInfos) <= 0 {
		return nil, errorcode.WithDetail(errorcode.PublicResourceNotFound, map[string]any{"service": serviceName, "name": "roleIds", "Id": roleId})
	}
	return roleInfos[0], nil
}

// GetRolesInfo get roles info
func (c *ConfigurationCenterCall) GetRolesInfo(ctx context.Context, roleIds []string) ([]*configuration_center.RoleInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	serviceName := "configuration-center"
	//需要的属性
	keys := "name,color,id,status,icon,userIds"
	roleIdString := strings.Join(roleIds, ",")
	//如果角色数量超过50个，那就返回错误
	if len(roleIds) > 50 {
		return nil, errorcode.WithDetail(errorcode.PublicCallParametersError, map[string]any{"service": serviceName})
	}
	//请求参数
	args := url.Values{}
	args.Set("role_ids", roleIdString)
	args.Set("keys", keys)
	//构建请求
	urlStr := fmt.Sprintf(GetRolesInfoURL, c.baseURL, args.Encode())
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", token)
	request = request.WithContext(ctx)
	//发起请求
	resp, err := c.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.WithDetail(errorcode.PublicServiceError, map[string]any{"service": serviceName})
	}
	defer resp.Body.Close()
	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error("read http response from GetRoleInfo error", zap.Error(err), zap.Any("roleIds", roleIdString))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.WithDetail(errorcode.PublicServiceError, map[string]any{"service": serviceName})
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return nil, errorcode.WithDetail(errorcode.PublicResourceNotFound, map[string]any{"service": serviceName, "name": "roleIds", "Id": roleIdString})
		}
	}

	var res []*configuration_center.RoleInfo
	err = json.Unmarshal(body, &res)
	if err != nil {
		log.WithContext(ctx).Error("Unmarshal http response from GetRoleInfo error", zap.Error(err), zap.Any("roleIds", roleIdString))
		return nil, errorcode.WithDetail(errorcode.PublicParseDataError, map[string]any{"service": serviceName, "err": err.Error()})
	}
	return res, nil
}

// GetRolesInfoMap get roles info, result in map
func (c *ConfigurationCenterCall) GetRolesInfoMap(ctx context.Context, roleIds []string) (map[string]*configuration_center.RoleInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	serviceName := "configuration-center"
	resultMap := make(map[string]*configuration_center.RoleInfo)
	if len(roleIds) == 0 {
		return resultMap, nil
	}

	roleInfos, err := c.GetRolesInfo(ctx, roleIds)
	if err != nil {
		return nil, err
	}
	if len(roleInfos) <= 0 {
		return nil, errorcode.WithDetail(errorcode.PublicResourceNotFound, map[string]any{"service": serviceName, "name": "roleIds", "Id": strings.Join(roleIds, ",")})
	}
	for _, roleInfo := range roleInfos {
		resultMap[roleInfo.Id] = roleInfo
	}
	return resultMap, nil
}

func (c *ConfigurationCenterCall) GetRemotePipelineInfo(ctx context.Context, flowID, flowVersion string) (*tc_project.PipeLineInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	//发起请求
	urlStr := fmt.Sprintf(GetRemotePipelineInfoURL, c.baseURL, flowID, flowVersion)
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", token)
	request = request.WithContext(ctx)
	resp, err := c.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectConfigCenterUrlError, err.Error())
	}
	defer resp.Body.Close()
	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	//根据状态判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.ProjectConfigCenterUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			res := new(errorcode.ErrorCodeBody)
			// 把请求到的数据Unmarshal到res中
			if err := json.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(err.Error())
				return nil, errorcode.Detail(errorcode.ProjectConfigCenterDataError, err.Error())
			}
			if res.Code == "ConfigurationCenter.Flowchart.FlowchartRoleMissing" {
				return nil, errorcode.Desc(errorcode.ProjectRelatedFlowChartValid)
			}
			return nil, errorcode.Desc(errorcode.ProjectConfigCenterFlowNotFound)
		}
	}
	res := new(tc_project.PipeLineInfo)
	// 把请求到的数据Unmarshal到res中
	if err := json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectConfigCenterDataError, err.Error())
	}
	if len(res.Nodes) == 0 {
		return nil, errorcode.Detail(errorcode.ProjectConfigCenterDataError, "该流水线无节点")
	}

	return res, nil
}

func (c *ConfigurationCenterCall) GetAlarmRule(ctx context.Context, types []string) ([]*configuration_center.AlarmRule, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	serviceName := "configuration-center"
	typeString := strings.Join(types, ",")
	urlStr := fmt.Sprintf(GetAlarmRuleURL, c.baseURL, typeString)
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", token)
	request = request.WithContext(ctx)
	//发起请求
	resp, err := c.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.WithDetail(errorcode.PublicServiceError, map[string]any{"service": serviceName})
	}
	defer resp.Body.Close()
	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error("read http response from GetAlarmRule error", zap.Error(err), zap.Any("types", typeString))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.WithDetail(errorcode.PublicServiceError, map[string]any{"service": serviceName})
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return nil, errorcode.WithDetail(errorcode.PublicResourceNotFound, map[string]any{"service": serviceName, "types": typeString})
		}
	}

	var res *configuration_center.AlarmRuleResp
	err = json.Unmarshal(body, &res)
	if err != nil {
		log.WithContext(ctx).Error("Unmarshal http response from GetAlarmRule error", zap.Error(err), zap.Any("types", typeString))
		return nil, errorcode.WithDetail(errorcode.PublicParseDataError, map[string]any{"service": serviceName, "err": err.Error()})
	}
	return res.Entries, nil
}

func (c *ConfigurationCenterCall) GenUniformCode(ctx context.Context, ruleID string, num int) ([]string, error) {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenConfigurationCenter get uniform code "
	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/code-generation-rules/%s/generation", c.baseURL, ruleID)
	bodyBuf, err := json.Marshal(map[string]int{"count": num})
	if err != nil {
		log.WithContext(ctx).Error("GenerateDemandCode json.Marshal failed: ", zap.Error(err))
		return nil, err
	}
	reader := bytes.NewReader(bodyBuf)

	request, _ := http.NewRequest(http.MethodPost, urlStr, reader)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.AddUsersToRoleError, err.Error())
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(errorcode.AddUsersToRoleError, err.Error())
	}

	var codes struct {
		Codes []string `json:"entries"`
	}
	if err = json.Unmarshal(body, &codes); err != nil {
		log.WithContext(ctx).Error("GenerateDemandCode failed", zap.Error(err), zap.String("url", urlStr))
		return nil, err
	}

	return codes.Codes, nil
}
