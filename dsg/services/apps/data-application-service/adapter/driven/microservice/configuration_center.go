package microservice

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/imroc/req/v2"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
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
	Type           string `json:"type"` // 就是配置中心库的type_name字段
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

type FirmListRes struct {
	Entries    []Firm `json:"entries"`
	TotalCount int    `json:"total_count"`
}

type Firm struct {
	ID   string `json:"id"`   // 厂商id
	Name string `json:"name"` // 厂商名称
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

type CodeGenerationReq struct {
	Count int `json:"count"`
}

type CodeGenerationRes struct {
	Entries []string `json:"entries"`
}

type DataSourceConfigRes struct {
	Using int `json:"using"`
}

// ConfigValue 代表配置值
type ConfigValue struct {
	// Key
	Key ConfigValueKey `json:"key,omitempty"`
	// Value
	Value ConfigValueValue `json:"value,omitempty"`
}

// ConfigValueKey 代表配置值的 Key
type ConfigValueKey string

// ConfigValueKey 代表配置值的 Key
const (
	// xx数据局
	ConfigValueKeyCSSJJ ConfigValueKey = "cssjj"
)

// ConfigValueKey 代表配置值的 Value
type ConfigValueValue string

// ConfigValueKey 代表配置值的 Value
const (
	// Boolean: false
	ConfigValueValueFalse ConfigValueValue = "false"
	// Boolean: true
	ConfigValueValueTrue ConfigValueValue = "true"
)

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
	// HasAccessPermission 检查权限
	HasAccessPermission(ctx context.Context, access_type access_control.AccessType, resource access_control.Resource) (bool, error)
	// CodeGeneration 编码生成
	CodeGeneration(ctx context.Context, ruleId string, count int) (res *CodeGenerationRes, err error)
	// GetDataResourceDirectoryConfigInfo 获取数据资源管理方式
	GetDataResourceDirectoryConfigInfo(ctx context.Context) (res *DataSourceConfigRes, err error)
	// GetConfigValue 获取配置值
	GetConfigValue(ctx context.Context, key ConfigValueKey) (cv *ConfigValue, err error)
	// AppsGetById 应用授权详情
	AppsGetById(ctx context.Context, id string, version string) (res *AppsGetByIdRes, err error)
	// GetInfoSystem 查询单个信息系统
	GetInfoSystem(ctx context.Context, id string) (res *GetInfoSystemRes, err error)
	// FirmList 厂商列表
	FirmList(ctx context.Context) (res *FirmListRes, err error)
}

// 编码生成规则：接口服务的 ID
const CodeGenerationRuleApiID = "15d8b9f8-f87b-11ee-aeae-005056b4b3fc"

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
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("DatasourceGet", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	res = &DatasourceResRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("DatasourceGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
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
	var headers map[string]string
	if bearerToken := util.GetToken(ctx); bearerToken != "" {
		if headers == nil {
			headers = make(map[string]string)
		}
		headers["Authorization"] = fmt.Sprintf("Bearer %s", util.GetToken(ctx))
	}

	url := r.baseURL + "/api/configuration-center/v1/objects/" + id
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
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("datasourceList", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	res = &DatasourceListRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("datasourceList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
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
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &SubDepartmentGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("SubDepartmentGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	return
}

func (r *configurationCenterRepo) HasAccessPermission(ctx context.Context, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	urlStr := fmt.Sprintf("%s/api/configuration-center/v1/access-control", r.baseURL)
	query := map[string]string{
		"access_type": strconv.Itoa(int(accessType.ToInt32())),
		"resource":    strconv.Itoa(int(resource.ToInt32())),
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
	client := &http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error("ConfigurationCenter HasAccessPermission client.Do error", zap.Error(err))
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error("ConfigurationCenter HasAccessPermission io.ReadAll error", zap.Error(err))
		return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
	}
	var has bool
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &has)
		if err != nil {
			log.WithContext(ctx).Error("ConfigurationCenter HasAccessPermission jsoniter.Unmarshal error", zap.Error(err))
			return false, errorcode.Detail(errorcode.GetAccessPermissionError, err)
		}
		return has, nil
	}
	return false, nil
}

func (r *configurationCenterRepo) CodeGeneration(ctx context.Context, ruleId string, count int) (res *CodeGenerationRes, err error) {
	codeGenerationReq := &CodeGenerationReq{Count: count}
	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetBody(codeGenerationReq).
		Post(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/code-generation-rules/" + ruleId + "/generation")
	if err != nil {
		log.WithContext(ctx).Error("CodeGeneration", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("CodeGeneration", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	res = &CodeGenerationRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("CodeGeneration", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
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
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("GetDataResourceDirectoryConfigInfo", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}
	res = &DataSourceConfigRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("GetDataResourceDirectoryConfigInfo", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	return
}

// GetConfigValue 获取配置值
func (r *configurationCenterRepo) GetConfigValue(ctx context.Context, key ConfigValueKey) (cv *ConfigValue, err error) {
	urlStr := fmt.Sprintf("%s/api/internal/configuration-center/v1/config-value?key=%s", r.baseURL, key)
	response, err := r.httpclient.Get(ctx, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetConfigValue", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	// response, err := req.C().R().SetContext(ctx).AddQueryParam("key", string(key)).Get(r.baseURL + "/api/internal/configuration-center/v1/config-value")
	// if err != nil {
	// 	log.WithContext(ctx).Error("GetConfigValue", zap.Error(err))
	// 	return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	// }
	// if response.StatusCode != 200 {
	// 	log.WithContext(ctx).Error("GetConfigValue", zap.Error(errors.New(response.String())))
	// 	return nil, errorcode.Detail(errorcode.InternalError, response.String())
	// }
	cv = &ConfigValue{}
	err = jsoniter.Unmarshal(response, &cv)
	if err != nil {
		log.WithContext(ctx).Error("GetConfigValue", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	return
}

// AppsGetByIdRes 应用授权详情响应
type AppsGetByIdRes struct {
	ID                   string              `json:"id"`                    // 应用ID
	Name                 string              `json:"name"`                  // 应用名称
	Description          string              `json:"description"`           // 应用描述
	InfoSystem           *InfoSystemRes      `json:"info_systems"`          // 信息系统
	ApplicationDeveloper *UserInfoRes        `json:"application_developer"` // 应用开发者
	AccountName          string              `json:"account_name"`          // 账号名称
	AccountID            string              `json:"account_id"`            // 账号Id
	HasResources         bool                `json:"has_resource"`          // 是否有资源
	ProvinceAppInfo      *ProvinceAppInfoRes `json:"province_app_info"`     // 省应用信息
	CreatedAt            int64               `json:"created_at"`            // 创建时间
	CreatedName          string              `json:"creator_name"`          // 创建人名称
	UpdatedAt            int64               `json:"updated_at"`            // 更新时间
	UpdatedName          string              `json:"updater_name"`          // 更新人名称
}

type InfoSystemRes struct {
	ID   string `json:"id"`   // 信息系统id
	Name string `json:"name"` // 信息系统名称
}

type UserInfoRes struct {
	UID      string `json:"id"`   // 用户id
	UserName string `json:"name"` // 用户名
}

type ProvinceAppInfoRes struct {
	AppId        string  `json:"app_id"`        // 省平台注册ID
	AccessKey    string  `json:"access_key"`    // 省平台应用key
	AccessSecret string  `json:"access_secret"` // 省平台应用secret
	ProvinceIp   string  `json:"province_ip"`   // 对外提供ip地址
	ProvinceUrl  string  `json:"province_url"`  // 对外提供url地址
	ContactName  string  `json:"contact_name"`  // 联系人姓名
	ContactPhone string  `json:"contact_phone"` // 联系人联系方式
	AreaInfo     *KVRes  `json:"area_info"`     // 应用领域
	RangeInfo    *KVRes  `json:"range_info"`    // 应用范围
	OrgInfo      *OrgRes `json:"org_info"`      // 部门信息
	DeployPlace  string  `json:"deploy_place"`  // 部署地点
}

type KVRes struct {
	ID    string `json:"id"`    // ID
	Value string `json:"value"` // 值
}

type OrgRes struct {
	OrgCode        string `json:"org_code"`        // 组织代码
	DepartmentId   string `json:"department_id"`   // 部门ID
	DepartmentName string `json:"department_name"` // 部门名称
}

func (r *configurationCenterRepo) AppsGetById(ctx context.Context, id string, version string) (res *AppsGetByIdRes, err error) {
	query := map[string]string{}
	if version != "" {
		query["version"] = version
	}

	response, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParams(query).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/apps/" + id)
	if err != nil {
		log.WithContext(ctx).Error("AppsGetById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("AppsGetById", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	res = &AppsGetByIdRes{}
	err = response.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("AppsGetById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}

// GetInfoSystemRes 信息系统详情响应
type GetInfoSystemRes struct {
	ID                string      `json:"id"`                  // 信息系统业务id
	Name              string      `json:"name"`                // 信息系统名称
	Description       interface{} `json:"description"`         // 信息系统描述（可能是字符串或对象）
	DepartmentId      interface{} `json:"department_id"`       // 信息系统部门ID
	InfoSystemId      int64       `json:"info_ststem_id"`      // 信息系统ID
	AcceptanceAt      interface{} `json:"acceptance_at"`       // 验收时间
	IsRegisterGateway interface{} `json:"is_register_gateway"` // 是否注册网关
	SystemIdentifier  string      `json:"system_identifier"`   // 系统标识符
	RegisterAt        string      `json:"register_at"`         // 注册时间
	CreatedAt         string      `json:"created_at"`          // 创建时间
	CreatedByUID      string      `json:"created_by_uid"`      // 创建用户ID
	UpdatedAt         string      `json:"updated_at"`          // 更新时间
	UpdatedByUID      string      `json:"updated_by_uid"`      // 更新用户ID
	DeletedAt         int64       `json:"deleted_at"`          // 删除时间
}

func (r *configurationCenterRepo) GetInfoSystem(ctx context.Context, id string) (res *GetInfoSystemRes, err error) {
	urlStr := fmt.Sprintf("%s/api/internal/configuration-center/v1/info-system/%s", settings.Instance.Services.ConfigurationCenter, id)
	response, err := r.httpclient.Get(ctx, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetConfigValue", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	// response, err := req.SetContext(ctx).
	// 	// SetBearerAuthToken(util.GetToken(ctx)).
	// 	// Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/info-system/" + id)
	// 	Get(settings.Instance.Services.ConfigurationCenter + "/api/internal/configuration-center/v1/info-system/" + id)
	// if err != nil {
	// 	log.WithContext(ctx).Error("GetInfoSystem", zap.Error(err))
	// 	return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	// }

	// if response.StatusCode != 200 {
	// 	log.WithContext(ctx).Error("GetInfoSystem", zap.Error(errors.New(response.String())))
	// 	return nil, errorcode.Detail(errorcode.InternalError, response.String())
	// }

	res = &GetInfoSystemRes{}
	// err = response.UnmarshalJson(res)
	err = jsoniter.Unmarshal(response, &res)
	if err != nil {
		log.WithContext(ctx).Error("GetInfoSystem", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}

// 根据CategoryList函数生成FirmList(ctx context.Context) (res *FirmListRes, err error)
func (u *configurationCenterRepo) FirmList(ctx context.Context) (res *FirmListRes, err error) {

	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		// SetQueryParams(query).
		Get(settings.Instance.Services.ConfigurationCenter + "/api/configuration-center/v1/firm")
	if err != nil {
		log.WithContext(ctx).Error("FirmList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("FirmList", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &FirmListRes{}
	err = resp.UnmarshalJson(res)
	if err != nil {
		log.WithContext(ctx).Error("FirmList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, err
}
