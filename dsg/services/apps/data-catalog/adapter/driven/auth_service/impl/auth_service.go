package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var _ auth_service.DrivenAuthService = (*AuthServiceImpl)(nil)

type AuthServiceImpl struct {
	url string
}

func NewAuthServiceImpl() auth_service.DrivenAuthService {
	return &AuthServiceImpl{url: settings.GetConfig().DepServicesConf.AuthServiceHost}
}

// GetDownloadPolicyEnforce 下载策略验证
func (a *AuthServiceImpl) GetDownloadPolicyEnforce(ctx context.Context, objectId string) (*auth_service.PolicyEnforceRespItem, error) {
	//获取登录用户ID
	uInfo := request.GetUserInfo(ctx)
	params := []map[string]interface{}{
		{
			"action":       "download",
			"object_id":    objectId,
			"object_type":  "data_catalog",
			"subject_id":   uInfo.ID,
			"subject_type": "user",
		},
	}
	buf, err := json.Marshal(params)
	if err != nil {
		log.WithContext(ctx).Errorf("GetDownloadEnforceResult json.Marshal error (params: %v)", params)
		return nil, errorcode.Detail(errorcode.AuthPolicyEnforceError, err)
	}
	log.WithContext(ctx).Infof("GetDownloadEnforceResult的Body请求体json====%s", string(buf))

	header := http.Header{
		"Content-Time":  []string{"application/json"},
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	buf, err = util.DoHttpPost(ctx, a.url+"/api/auth-service/v1/enforce", header, bytes.NewReader(buf))
	if err != nil {
		log.WithContext(ctx).Errorf("GetDownloadEnforceResult接口报错返回，err is: %v", err)
		return nil, errorcode.Detail(errorcode.AuthPolicyEnforceError, err)
	}

	var resp []*auth_service.PolicyEnforceRespItem
	if err = json.Unmarshal(buf, &resp); err != nil {
		return nil, errorcode.Detail(errorcode.AuthPolicyEnforceError, err)
	}
	if len(resp) == 1 {
		return resp[0], nil
	}

	log.WithContext(ctx).Errorf("GetDownloadEnforceResult接口返回数组长度不为1，resp is: %v", resp)
	return nil, errorcode.Detail(errorcode.AuthPolicyEnforceError, err)
}

// GetPolicyAvailableAssets 访问者拥有的资源
func (a *AuthServiceImpl) GetPolicyAvailableAssets(ctx context.Context) (availableRespItems []*auth_service.PolicyAvailableRespItem, err error) {
	//获取登录用户ID
	uInfo := request.GetUserInfo(ctx)
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	urlStr := a.url + "/api/auth-service/v1/subject/objects"
	val := url.Values{
		"object_type":  []string{"data_catalog"},
		"subject_id":   []string{uInfo.ID},
		"subject_type": []string{"user"},
	}

	buf, err := util.DoHttpGet(ctx, urlStr, header, val)
	if err != nil {
		log.WithContext(ctx).Errorf("GetPolicyAvailableAssets error (err: %v)", err)
		return nil, errorcode.Detail(errorcode.AuthAvailableAssetsError, err)
	}
	var resp struct {
		TotalCount         int `json:"total_count"` //资源id
		AvailableRespItems []*auth_service.PolicyAvailableRespItem
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		return nil, errorcode.Detail(errorcode.AuthAvailableAssetsError, err)
	}

	return resp.AvailableRespItems, nil
}

//// 获取策略详情
//func (a *AuthServiceImpl) getPolicyDetail(ctx context.Context, objectId string) (*auth_service.PolicyDetailResp, error) {
//	header := http.Header{
//		"Authorization": []string{ctx.Value(interception.Token).(string)},
//	}
//	urlStr := a.url + "/api/auth-service/v1/policy"
//	val := url.Values{
//		"object_id":   []string{objectId},
//		"object_type": []string{"data_catalog"},
//	}
//
//	buf, err := util.DoHttpGet(ctx, urlStr, header, val)
//	if err != nil {
//		return nil, errorcode.Detail(errorcode.AuthPolicyGetError, err)
//	}
//	res := &auth_service.PolicyDetailResp{}
//	if err = json.Unmarshal(buf, res); err != nil {
//		return nil, errorcode.Detail(errorcode.AuthPolicyGetError, err)
//	}
//	return res, nil
//}
