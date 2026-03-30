package microservice

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"sort"
	"strconv"

	"go.uber.org/zap"

	"github.com/imroc/req/v3"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/interception"
	middleware "github.com/kweaver-ai/idrm-go-common/middleware/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DatasourceListReq struct{}

type DatasourceListRes struct {
	Entries    []Datasource `json:"entries"`
	TotalCount int          `json:"total_count"`
}

type Datasource struct {
	ID           string `json:"id"`            // 数据源id
	Name         string `json:"name"`          // 数据源名称
	CatalogName  string `json:"catalog_name"`  // 虚拟化引擎 catalog
	Type         string `json:"type"`          // 数据源类型
	DatabaseName string `json:"database_name"` // 数据库名称
	Schema       string `json:"schema"`        // 数据库模式
}

type DepartmentGetRes struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Path   string `json:"path"`
	PathId string `json:"path_id"`
	Type   string `json:"type"`
}

type SubDepartmentGetRes struct {
	Entries []struct {
		Id     string `json:"id"`
		Name   string `json:"name"`
		Type   string `json:"type"`
		Path   string `json:"path"`
		PathId string `json:"path_id"`
	} `json:"entries"`
	TotalCount int `json:"total_count"`
}

type ConfigurationCenterRepo interface {
	// 数据源列表
	DatasourceList(ctx context.Context) (res *DatasourceListRes, err error)
	// 部门是否存在
	IsDepartmentExist(ctx context.Context, id string) (exist bool, err error)
	// 部门详情
	DepartmentGet(ctx context.Context, id string) (res *DepartmentGetRes, err error)
	// 指定部门下的所有子部门
	SubDepartmentGet(ctx context.Context, id string) (res *SubDepartmentGetRes, err error)
	// UserIsInRole 检查用户是否拥有指定角色，用户 ID 为空时检查当前用户
	UserIsInRole(ctx context.Context, userID, roleID string) (bool, error)
	// UserHasAnyRoles 是 UserIsInRole 的封装，判断用户是否拥有指定角色中的任意一个，用户 ID 为空时检查当前用户
	UserHasAnyRoles(ctx context.Context, userID string, roleIDs []string) (bool, error)
}

type configurationCenterRepo struct {
	baseURL       string
	RawHttpClient *http.Client
	httpclient    util.HTTPClient
}

func NewConfigurationCenterRepo(rawHttpClient *http.Client, httpclient util.HTTPClient) ConfigurationCenterRepo {
	return &configurationCenterRepo{
		baseURL:       settings.Instance.Services.ConfigurationCenter,
		RawHttpClient: rawHttpClient,
		httpclient:    httpclient,
	}
}

func (r *configurationCenterRepo) DatasourceList(ctx context.Context) (res *DatasourceListRes, err error) {
	res = &DatasourceListRes{
		Entries: make([]Datasource, 0),
	}
	offset := 1
	limit := 2000
	for {
		datasourceListRes, err := r.datasourceList(ctx, offset, limit)
		if err != nil {
			return nil, err
		}

		res.Entries = append(res.Entries, datasourceListRes.Entries...)
		res.TotalCount = datasourceListRes.TotalCount

		if len(datasourceListRes.Entries) < limit {
			break
		}

		offset++
	}

	sort.SliceStable(res.Entries, func(i, j int) bool {
		return res.Entries[i].Name+res.Entries[i].DatabaseName < res.Entries[j].Name+res.Entries[j].DatabaseName
	})

	return res, err
}

func (r *configurationCenterRepo) IsDepartmentExist(ctx context.Context, id string) (exist bool, err error) {
	departmentGetRes, err := r.DepartmentGet(ctx, id)
	if err != nil {
		return false, err
	}

	if departmentGetRes.Name == "" {
		return false, nil
	}

	return true, nil
}

func (r *configurationCenterRepo) DepartmentGet(ctx context.Context, id string) (res *DepartmentGetRes, err error) {
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/objects/" + id)
	if err != nil {
		log.WithContext(ctx).Error("DepartmentGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DepartmentGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DepartmentGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DepartmentGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, nil
}

func (r *configurationCenterRepo) datasourceList(ctx context.Context, offset int, limit int) (res *DatasourceListRes, err error) {
	//req.DevMode()

	query := map[string]string{
		"offset": strconv.Itoa(offset),
		"limit":  strconv.Itoa(limit),
	}

	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParams(query).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/datasource")
	if err != nil {
		log.WithContext(ctx).Error("datasourceList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("datasourceList", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	res = &DatasourceListRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("datasourceList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	return res, nil
}

func (r *configurationCenterRepo) SubDepartmentGet(ctx context.Context, id string) (res *SubDepartmentGetRes, err error) {
	//req.DevMode()
	query := map[string]string{
		"id":    id,
		"limit": "0",
	}
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParams(query).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/objects")
	if err != nil {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &SubDepartmentGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	return
}

// UserIsInRole implements ConfigurationCenterRepo.
func (r *configurationCenterRepo) UserIsInRole(ctx context.Context, userID string, roleID string) (ok bool, err error) {
	log := log.WithContext(ctx)

	// 如果未指定用户 ID 则从 context 获取当前用户 ID
	if userID == "" {
		userID = userIDFromContextOrEmpty(ctx)
	}
	// 如果用户 ID 仍然为空则报错
	if userID == "" {
		log.Error("userID is empty")
		err = errorcode.Detail(errorcode.PublicInternalError, "userID is empty")
		return
	}

	// 生成 API 端点
	base, err := url.Parse(r.baseURL)
	if err != nil {
		log.Error("parse configuration-center base url fail", zap.Error(err))
		err = errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("parse configuration-center base url fail: %v", err))
		return
	}
	base.Path = path.Join(base.Path, "/api/configuration-center/v1/roles", roleID, userID)

	// 生成 HTTP 请求
	req, err := http.NewRequest(http.MethodGet, base.String(), http.NoBody)
	if err != nil {
		log.Error("create http request fail", zap.Error(err))
		err = errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("create http request fail: %v", err))
		return
	}

	// 设置 Authorization
	if t, err := interception.BearerTokenFromContextCompatible(ctx); err == nil {
		req.Header.Set("Authorization", "Bearer "+t)
	}

	// 发送 HTTP 请求
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Error("send http request fail", zap.Error(err))
		err = errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("send http request fail: %v", err))
		return
	}
	defer resp.Body.Close()

	// 读取 HTTP Response Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error("read http response body fail", zap.Error(err))
		err = errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("read http response body fail: %v", err))
		return
	}

	// 检查 HTTP Status Code
	if resp.StatusCode != http.StatusOK {
		log.Error("unexpected http status", zap.String("method", resp.Request.Method), zap.Stringer("url", resp.Request.URL), zap.String("status", resp.Status), zap.ByteString("body", body))
		err = errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("unexpected http status: %v", resp.Status))
		return
	}

	// 反序列化 HTTP Response Body
	if err = json.Unmarshal(body, &ok); err != nil {
		log.Error("decode http response body fail", zap.Error(err), zap.ByteString("body", body))
		err = errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("decode http response body fail: %v", err))
		return
	}

	return
}

// UserHasAnyRoles implements ConfigurationCenterRepo.
func (r *configurationCenterRepo) UserHasAnyRoles(ctx context.Context, userID string, roleIDs []string) (ok bool, err error) {
	for _, rid := range roleIDs {
		// 如果未指定用户 UserIsInRole 检查当前用户，所以不需要在此处获取当前用户 ID
		if ok, err = r.UserIsInRole(ctx, userID, rid); err != nil || ok {
			return
		}
	}
	return
}

// userIDFromContext 从 context 获取用户 ID，不存在或类型错误返回 error
func userIDFromContext(ctx context.Context) (string, error) {
	if u, err := middleware.UserFromContext(ctx); err == nil {
		return u.ID, nil
	}

	v := ctx.Value(interception.InfoName)
	if v == nil {
		log.WithContext(ctx).Error("no dto.UserInfo was present")
		return "", errorcode.Detail(errorcode.PublicInternalError, "no dto.UserInfo was present")
	}

	u, ok := v.(*dto.UserInfo)
	if !ok {
		log.WithContext(ctx).Error("unexpected value type for UserInfo context key", zap.Any("value", v))
		return "", errorcode.Detail(errorcode.PublicInternalError, fmt.Errorf("unexpected value type for UserInfo context key: %T", v))
	}

	return u.Id, nil
}

// userIDFromContextOrEmpty 从 context 获取用户 ID，不存在或类型错误返回空字符串
func userIDFromContextOrEmpty(ctx context.Context) string {
	id, _ := userIDFromContext(ctx)
	return id
}

// NewGoCommonConfigurationCenterDriven 创建 GoCommon 提供的 configuration-center 客户端
func NewGoCommonConfigurationCenterDriven(c *http.Client) configuration_center.Driven {
	return impl.NewConfigurationCenterDriven(c, settings.Instance.Services.ConfigurationCenter, settings.Instance.Services.WorkflowRest, "")
}
