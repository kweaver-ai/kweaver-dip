package impl

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

func (c *ConfigurationCenterCall) HasAccessPermission(ctx context.Context, uid string, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/access-control", c.baseURL)
	query := map[string]string{
		"access_type": strconv.Itoa(int(accessType.ToInt32())),
		"resource":    strconv.Itoa(int(resource.ToInt32())),
	}
	if uid != "" {
		query["user_id"] = uid
	}
	params := make([]string, 0, len(query))
	for k, v := range query {
		params = append(params, k+"="+v)
	}
	if len(params) > 0 {
		urlStr = urlStr + "?" + strings.Join(params, "&")
	}

	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error("DrivenConfigurationCenter HasAccessPermission client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error("DrivenConfigurationCenter HasAccessPermission io.ReadAll error", zap.Error(err))
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}
	var has bool
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &has)
		if err != nil {
			log.WithContext(ctx).Error("DrivenConfigurationCenter HasAccessPermission jsoniter.Unmarshal error", zap.Error(err))
			return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
		}
		return has, nil
	}
	return false, nil
}
func (c *ConfigurationCenterCall) AddUsersToRole(ctx context.Context, rid, uid string) error {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenConfigurationCenter AddUsersToRole "
	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/roles/%s/relations", c.baseURL, rid)
	var param struct {
		Uids []string `json:"uids"`
	}
	param.Uids = append(param.Uids, uid)
	jsonReq, _ := jsoniter.Marshal(param)
	reader := bytes.NewReader(jsonReq)

	request, _ := http.NewRequest(http.MethodPost, urlStr, reader)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(errorcode.AddUsersToRoleError, err.Error())
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return errorcode.Detail(errorcode.AddUsersToRoleError, err.Error())
	}

	if resp.StatusCode == http.StatusOK {
		return nil
	} else if resp.StatusCode == http.StatusBadRequest {
		res := new(errorcode.ErrorCodeBody)
		if err = jsoniter.Unmarshal(body, res); err != nil {
			log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return errorcode.Detail(errorcode.AddUsersToRoleError, err.Error())
		}
		log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("Code", res.Code), zap.String("Description", res.Description), zap.String("Cause", res.Cause), zap.String("Solution", res.Solution))
		return errorcode.Detail(errorcode.AddUsersToRoleError, res.Code)
	} else if resp.StatusCode == http.StatusForbidden {
		return errorcode.Desc(errorcode.UserNotHavePermission)
	} else {
		log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
		return errorcode.Desc(errorcode.AddUsersToRoleError)
	}
}
func (c *ConfigurationCenterCall) DeleteUsersToRole(ctx context.Context, rid, uid string) error {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenConfigurationCenter DeleteUsersToRole "

	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/roles/%s/relations?uid=%s", c.baseURL, rid, uid)

	request, _ := http.NewRequest(http.MethodDelete, urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return errorcode.Detail(errorcode.DeleteUsersToRoleError, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return errorcode.Detail(errorcode.DeleteUsersToRoleError, err.Error())
	}

	if resp.StatusCode == http.StatusOK {
		return nil
	} else if resp.StatusCode == http.StatusBadRequest {
		res := new(errorcode.ErrorCodeBody)
		if err = jsoniter.Unmarshal(body, res); err != nil {
			log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return errorcode.Detail(errorcode.DeleteUsersToRoleError, err.Error())
		}
		log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
		return errorcode.Detail(errorcode.DeleteUsersToRoleError, res.Code)
	} else if resp.StatusCode == http.StatusForbidden {
		return errorcode.Desc(errorcode.UserNotHavePermission)
	} else {
		log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
		return errorcode.Desc(errorcode.DeleteUsersToRoleError)
	}
}

func (c *ConfigurationCenterCall) GetRoleUsers(ctx context.Context, rid string, info configuration_center.UserRolePageInfo) ([]*configuration_center.User, error) {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenConfigurationCenter GetRoleUsers "

	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/roles/%s/relations", c.baseURL, rid)
	query := make(map[string]any)
	if info.Offset != 0 {
		query["offset"] = info.Offset
	}
	if info.Limit != 0 {
		query["limit"] = info.Limit
	}
	if info.Direction != "" {
		query["direction"] = info.Direction
	}
	if info.Sort != "" {
		query["sort"] = info.Sort
	}
	params := make([]string, 0, len(query))
	for k, v := range query {
		params = append(params, fmt.Sprintf("%s=%v", k, v))
	}
	if len(params) > 0 {
		urlStr = urlStr + "?" + strings.Join(params, "&")
	}

	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err)
	}
	var res configuration_center.PageResult
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+"jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err)
		}
		return res.Entries, nil
	} else if resp.StatusCode == http.StatusBadRequest {
		res := new(errorcode.ErrorCodeBody)
		if err = jsoniter.Unmarshal(body, res); err != nil {
			log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err.Error())
		}
		log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description), zap.String("Cause", res.Cause))
		return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, res.Code)
	} else if resp.StatusCode == http.StatusForbidden {
		return nil, errorcode.Desc(errorcode.UserNotHavePermission)
	} else {
		log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
		return nil, errorcode.Desc(errorcode.GetProjectMgmRoleUsers, zap.Int("code", resp.StatusCode))
	}
}

func (c *ConfigurationCenterCall) UserIsInRole(ctx context.Context, rid string, uid string) (bool, error) {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenConfigurationCenter UserIsInRole "

	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/roles/%s/%s", c.baseURL, rid, uid)

	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.UserIsInProjectMgm, err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll error", zap.Error(err))
		return false, errorcode.Detail(errorcode.UserIsInProjectMgm, err)
	}
	var has bool
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &has)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+"jsoniter.Unmarshal error", zap.Error(err))
			return false, errorcode.Detail(errorcode.UserIsInProjectMgm, err)
		}
		return has, nil
	} else if resp.StatusCode == http.StatusBadRequest {
		res := new(errorcode.ErrorCodeBody)
		if err = jsoniter.Unmarshal(body, res); err != nil {
			log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return false, errorcode.Detail(errorcode.UserIsInProjectMgm, err.Error())
		}
		log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description), zap.String("Cause", res.Cause))
		return false, errorcode.Detail(errorcode.UserIsInProjectMgm, res.Code)
	} else if resp.StatusCode == http.StatusForbidden {
		return false, errorcode.Desc(errorcode.UserNotHavePermission)
	} else {
		log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
		return false, errorcode.Desc(errorcode.UserIsInProjectMgm, zap.Int("code", resp.StatusCode))
	}
}

func (c *ConfigurationCenterCall) GetProjectMgmUsers(ctx context.Context, projectMgmId, thirdUserId, keyword string) ([]*configuration_center.User, error) {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	errorMsg := "DrivenConfigurationCenter GetProjectMgmUsers "

	urlStr := fmt.Sprintf("http://%s/api/configuration-center/v1/permission/query-permission-user-list/%s/search?third_user_id=%s&keyword=%s", c.baseURL, projectMgmId, thirdUserId, keyword)

	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err)
	}
	var res configuration_center.PermissionUserResp
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+"jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err)
		}
		return res.Entries, nil
	} else if resp.StatusCode == http.StatusBadRequest {
		res := new(errorcode.ErrorCodeBody)
		if err = jsoniter.Unmarshal(body, res); err != nil {
			log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
			return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, err.Error())
		}
		log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description), zap.String("Cause", res.Cause))
		return nil, errorcode.Detail(errorcode.GetProjectMgmRoleUsers, res.Code)
	} else if resp.StatusCode == http.StatusForbidden {
		return nil, errorcode.Desc(errorcode.UserNotHavePermission)
	} else {
		log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
		return nil, errorcode.Desc(errorcode.GetProjectMgmRoleUsers, zap.Int("code", resp.StatusCode))
	}
}
