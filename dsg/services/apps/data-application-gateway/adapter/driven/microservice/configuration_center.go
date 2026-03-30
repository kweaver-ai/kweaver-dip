package microservice

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type DatasourceListReq struct{}

type DatasourceListRes struct {
	Entries    []Datasource `json:"entries"`
	TotalCount int          `json:"total_count"`
}

type DatasourceResRes struct {
	Id             string `json:"id"`
	InfoSystemId   string `json:"info_system_id"`
	InfoSystemName string `json:"info_system_name"`
	Name           string `json:"name"`
	Type           string `json:"type"`
	CatalogName    string `json:"catalog_name"`
	SourceType     string `json:"source_type"`
	DatabaseName   string `json:"database_name"`
	Schema         string `json:"schema"`
	Host           string `json:"host"`
	Port           int    `json:"port"`
	Username       string `json:"username"`
	UpdatedByUid   string `json:"updated_by_uid"`
	UpdatedAt      int64  `json:"updated_at"`
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
	Id   string `json:"id"`
	Name string `json:"name"`
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

type DataSourceConfigRes struct {
	Using int `json:"using"`
}

type AppsID struct {
	Id string `json:"id" uri:"id" binding:"required,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
}
type Apps struct {
	ID                   string        `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"`         // 应用ID
	Name                 string        `json:"name" example:"name"`                                       // 应用名称
	Description          string        `json:"description" example:"description"`                         // 应用描述
	InfoSystem           *InfoSystem   `json:"info_systems"`                                              // 信息系统
	ApplicationDeveloper *UserInfoResp `json:"application_developer"`                                     // 应用开发者
	AccountName          string        `json:"account_name" example:"account_name"`                       // 账号名称
	AccountID            string        `json:"account_id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 账号Id
	// AuthorityScope       []string         `json:"authority_scope" example:"demand_task,business_grooming,standardization,resource_management,configuration_center"` // 权限范围
	HasResources bool   `json:"has_resource"`                       //是否有资源
	CreatedAt    int64  `json:"created_at" example:"1684301771000"` // 创建时间
	CreatedName  string `json:"creator_name" example:"创建人名称"`       //创建人
	UpdatedAt    int64  `json:"updated_at" example:"1684301771000"` // 更新时间
	UpdatedName  string `json:"updater_name" example:"更新人名称"`       //更新人
}
type InfoSystem struct {
	ID   string `json:"id"`   // 信息系统id，uuid
	Name string `json:"name"` // 信息系统名称
}
type UserInfoResp struct {
	UID      string `json:"id"`   // 用户id，uuid
	UserName string `json:"name"` // 用户名
}

type Depart struct {
	ID   string `json:"id"`   // 部门标识
	Name string `json:"name"` // 部门名称
}

type ConfigurationCenterRepo interface {
	// DatasourceList 数据源列表
	DatasourceList(ctx context.Context) (res *DatasourceListRes, err error)
	// DatasourceGet 数据源详情
	DatasourceGet(ctx context.Context, id string) (res *DatasourceResRes, err error)
	// IsDepartmentExist 部门是否存在
	IsDepartmentExist(ctx context.Context, id string) (exist bool, err error)
	// DepartmentGet 部门详情
	DepartmentGet(ctx context.Context, id string) (res *DepartmentGetRes, err error)
	// SubDepartmentGet 指定部门下的所有子部门
	SubDepartmentGet(ctx context.Context, id string) (res *SubDepartmentGetRes, err error)
	// GetDataResourceDirectoryConfigInfo 获取数据资源管理方式
	GetDataResourceDirectoryConfigInfo(ctx context.Context) (res *DataSourceConfigRes, err error)
	// AppsGetById 应用授权详情
	AppsGetById(ctx context.Context, req *AppsID) (*Apps, error)
	// GetUserIdDepart
	GetUserIdDepart(ctx context.Context, uid string) ([]*Depart, error)
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

func (r *configurationCenterRepo) DatasourceGet(ctx context.Context, id string) (res *DatasourceResRes, err error) {
	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/datasource/" + id)
	if err != nil {
		log.WithContext(ctx).Error("DatasourceGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("DatasourceGet", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, response.String())
	}

	res = &DatasourceResRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("DatasourceGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	return
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
	headers := map[string]string{
		"Authorization": util.GetToken(ctx),
	}

	url := settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/objects/" + id
	data, err := r.httpclient.Get(ctx, url, headers)
	if err != nil {
		log.WithContext(ctx).Errorf("%s", err.Error())
		return nil, err
	}

	res = &DepartmentGetRes{}
	if err := json.Unmarshal(data, res); err != nil {
		return nil, err
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
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("datasourceList", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, response.String())
	}

	res = &DatasourceListRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("datasourceList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
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
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, resp.String())
	}

	res = &SubDepartmentGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}
	return
}

// GetDataResourceDirectoryConfigInfo 获取数据资源管理方式（数据资源目录、数据资源）
func (r *configurationCenterRepo) GetDataResourceDirectoryConfigInfo(ctx context.Context) (res *DataSourceConfigRes, err error) {
	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/data/using")
	if err != nil {
		log.WithContext(ctx).Error("GetDataResourceDirectoryConfigInfo", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("GetDataResourceDirectoryConfigInfo", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.PublicInternalError, response.String())
	}
	res = &DataSourceConfigRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("GetDataResourceDirectoryConfigInfo", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	return
}

func (r *configurationCenterRepo) AppsGetById(ctx context.Context, appsReq *AppsID) (*Apps, error) {
	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/apps/" + appsReq.Id)
	if err != nil {
		log.WithContext(ctx).Error("AppsGetById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("AppsGetById", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, response.String())
	}

	res := &Apps{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("AppsGetById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	return res, nil
}

func (r *configurationCenterRepo) GetUserIdDepart(ctx context.Context, uid string) ([]*Depart, error) {
	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/internal/configuration-center/v1/" + uid + "/depart")
	if err != nil {
		log.WithContext(ctx).Error("GetUserIdDepart", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("GetUserIdDepart", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, response.String())
	}

	res := make([]*Depart, 0)
	err = response.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("GetUserIdDepart", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
	}

	return res, nil
}
