package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"sort"

	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

type AuthService struct {
	baseURL    string
	HttpClient *http.Client
}

func NewAuthService(conf *my_config.Bootstrap, httpClient *http.Client) auth_service.DrivenAuthService {
	return &AuthService{
		baseURL:    conf.DepServices.AuthServiceHost,
		HttpClient: httpClient,
	}
}

func (a *AuthService) GetUsersObjects(ctx context.Context, param *auth_service.GetUsersObjectsReq) (res *auth_service.GetUsersObjectsRes, err error) {
	const drivenMsg = "DrivenAuthService GetUsersObjects"

	url := fmt.Sprintf("%s/api/auth-service/v1/subject/objects?subject_id=%s&subject_type=%s&object_type=%s", a.baseURL, param.SubjectId, param.SubjectType, param.ObjectType)
	log.Infof(drivenMsg+" url:%s \n", url)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		err = errorcode.Detail(my_errorcode.AuthServiceGetUsersObjectsFailed, err.Error())
		return
	}

	if t, ok := ctx.Value(interception.Token).(string); ok {
		req.Header.Set("Authorization", t)
	}

	log.Info("request", zap.String("method", req.Method), zap.String("url", url))

	resp, err := a.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		err = errorcode.Detail(my_errorcode.AuthServiceGetUsersObjectsFailed, err.Error())
		return
	}
	defer resp.Body.Close()

	log.Info("response", zap.String("method", req.Method), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		err = errorcode.Detail(my_errorcode.AuthServiceGetUsersObjectsFailed, err.Error())
		return
	}
	if resp.StatusCode != http.StatusOK {
		return nil, TransparentErrorCode(ctx, body, drivenMsg)
	}

	log.Info("response", zap.String("body", string(body)))

	res = &auth_service.GetUsersObjectsRes{}
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceGetUsersObjectsFailed, err.Error())
	}

	return res, nil

}
func TransparentErrorCode(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return my_errorcode.AuthServiceError.Detail(err.Error())
	}
	log.WithContext(ctx).Errorf("%+v", res)
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}

func (a *AuthService) VerifyUserAuthority(ctx context.Context,
	reqParams []*auth_service.VerifyUserAuthorityReq) ([]*auth_service.VerifyUserAuthorityEntry, error) {
	const drivenMsg = "DrivenAuthService VerifyUserAuthority"
	url := fmt.Sprintf("%s/api/auth-service/v1/enforce", a.baseURL)
	buf, err := jsoniter.Marshal(reqParams)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.PublicInternalServerError, err.Error())
	}
	log.Infof(drivenMsg+" url:%s \n %+v", url, reqParams)
	var req *http.Request
	req, err = http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(buf))
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.NewRequestWithContext error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.PublicInternalServerError, err.Error())
	}

	log.Info("request", zap.String("method", req.Method), zap.String("url", url))
	req.Header.Add("Content-Type", "application/json")
	resp, err := a.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" http.DefaultClient.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	defer resp.Body.Close()

	log.Info("response", zap.String("method", req.Method), zap.String("url", url), zap.Int("statusCode", resp.StatusCode))

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	if resp.StatusCode != http.StatusOK {
		return nil, TransparentErrorCode(ctx, body, drivenMsg)
	}

	log.Info("response", zap.String("body", string(body)))

	var res []*auth_service.VerifyUserAuthorityEntry
	if err = json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}

	return res, nil
}

// VerifyUserPermissionOnSameTypeObjects implements auth_service.DrivenAuthService.
func (a *AuthService) VerifyUserPermissionOnSameTypeObjects(ctx context.Context, action string, objectType string, objectIDs ...string) (result []bool, err error) {
	// get user info from context
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return
	}

	subjectType := auth_service.SubjectTypeUser
	v := ctx.Value(interception.TokenType)
	if v != nil {
		if vType, ok := v.(int); ok && vType == interception.TokenTypeClient {
			subjectType = auth_service.SubjectTypeApp
		}
	}

	// build api endpoint
	base, err := url.Parse(a.baseURL)
	if err != nil {
		log.WithContext(ctx).Error("parse auth-service baseURL fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	base.Path = path.Join(base.Path, "/api/auth-service/v1/enforce")

	// request object
	var request []auth_service.VerifyUserAuthorityReq
	for _, id := range objectIDs {
		request = append(request, auth_service.VerifyUserAuthorityReq{
			ObjectId: id,
			Action:   action,
			GetUsersObjectsReq: auth_service.GetUsersObjectsReq{
				ObjectType:  objectType,
				SubjectId:   u.ID,
				SubjectType: subjectType,
			},
		})
	}
	// encode request object as json
	requestJSON, err := json.Marshal(request)
	if err != nil {
		log.WithContext(ctx).Error("encode request object fail", zap.Error(err), zap.Any("object", request))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}

	// create http request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), bytes.NewReader(requestJSON))
	if err != nil {
		log.WithContext(ctx).Error("new http request fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	req.Header.Set("content-type", "application/json")
	if t, ok := ctx.Value(interception.Token).(string); ok {
		req.Header.Set("Authorization", t)
	}

	// send http request
	resp, err := a.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	defer resp.Body.Close()

	// failure
	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.WithContext(ctx).Error("read response body fail", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, fmt.Sprintf("enforce policy fail, status: %s, read response body fail: %v", resp.Status, err))
		}
		return nil, TransparentErrorCode(ctx, body, "DrivenAuthService VerifyUserPermissionOnSameTypeObjects")
	}

	// decode response body
	var entries []auth_service.VerifyUserAuthorityEntry
	if err := json.NewDecoder(resp.Body).Decode(&entries); err != nil {
		log.WithContext(ctx).Error("decode response body fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}

	// sort entries by object id
	sort.Slice(entries, func(i, j int) bool { return entries[i].ObjectId < entries[j].ObjectId })

	for _, e := range entries {
		result = append(result, e.Effect == auth_service.Effect_Allow)
	}

	return
}

// VerifyUserPermissionObject implements auth_service.DrivenAuthService.
func (a *AuthService) VerifyUserPermissionObject(ctx context.Context, action string, objectType string, objectID string) (ok bool, err error) {
	result, err := a.VerifyUserPermissionOnSameTypeObjects(ctx, action, objectType, objectID)
	if err != nil {
		return false, err
	}

	return len(result) >= 1 && result[0], nil
}

// Enforce implements auth_service.DrivenAuthService.
func (a *AuthService) Enforce(ctx context.Context, requests []auth_service.EnforceRequest) (responses []bool, err error) {
	// build api endpoint
	base, err := url.Parse(a.baseURL)
	if err != nil {
		log.WithContext(ctx).Error("parse auth-service baseURL fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	base.Path = path.Join(base.Path, "/api/auth-service/v1/enforce")

	// encode requests as json
	requestsJSON, err := json.Marshal(requests)
	if err != nil {
		log.WithContext(ctx).Error("encode requests fail", zap.Error(err), zap.Any("object", requests))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	log.WithContext(ctx).Debug("http request", zap.ByteString("body", requestsJSON))

	// create http request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), bytes.NewReader(requestsJSON))
	if err != nil {
		log.WithContext(ctx).Error("new http request fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	req.Header.Set("content-type", "application/json")
	if t, err := interception.BearerTokenFromContext(ctx); err == nil {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", t))
	} else if auth, err := interception.AuthFromContext(ctx); err == nil {
		req.Header.Set("Authorization", auth)
	} else if t, ok := ctx.Value(interception.Token).(string); ok {
		req.Header.Set("Authorization", t)
	}

	// send http request
	resp, err := a.HttpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error("read response body fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, fmt.Sprintf("enforce policy fail, status: %s, read response body fail: %v", resp.Status, err))
	}
	log.WithContext(ctx).Debug("http response", zap.String("status", resp.Status), zap.String("method", resp.Request.Method), zap.Stringer("url", resp.Request.URL), zap.Any("header", resp.Header), zap.ByteString("body", body))

	// failure
	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.WithContext(ctx).Error("read response body fail", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, fmt.Sprintf("enforce policy fail, status: %s, read response body fail: %v", resp.Status, err))
		}
		return nil, TransparentErrorCode(ctx, body, "DrivenAuthService Enforce")
	}

	// decode response body
	if err := json.Unmarshal(body, &responses); err != nil {
		log.WithContext(ctx).Error("decode response body fail", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.AuthServiceCheckUsersAuthorityFailed, err.Error())
	}

	return
}
