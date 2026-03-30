package basic_search

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
)

type Repo interface {
	//搜索数据资源目录
	SearchDataCatalog(ctx context.Context, req *SearchReqBodyParam) (resp *SearchDataRescoureseCatalogResp, err error)

	// 搜索数据资源
	SearchDataResource(ctx context.Context, req *SearchDataResourceRequest) (resp *SearchDataResourceResponse, err error)
	// 搜索信息资源目录
	SearchInfoCatalog(ctx context.Context, req *info_resource_catalog.EsSearchParam) (res *info_resource_catalog.EsSearchResult, err error)

	//SearchElecLicence  搜索电子证照
	SearchElecLicence(ctx context.Context, req *SearchElecLicenceRequest) (resp *SearchElecLicenceResponse, err error)
}

type SearchDataRescouresCatalogParam struct {
	//SearchReqQueryParam `param_type:"query"`
	SearchReqBodyParam `param_type:"body"`
}

type SearchReqQueryParam struct {
	Statistics bool `json:"statistics,omitempty" form:"statistics" binding:"omitempty" example:"true"` // 是否返回统计信息，若body参数中next_flag存在，则该参数无效（不会返回统计信息）
}

type SearchReqBodyParam struct {
	CommonSearchParam
	Orders   []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`               // 排序，没有keyword时默认以published_at desc排序，有keyword时默认以_score desc排序
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"`                                                                   // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" binding:"required,oneof=_score data_updated_at table_rows published_at online_at updated_at apply_num" example:"_score"` // 排序类型，枚举：_score：按算分排序；data_updated_at：按数据更新时间排序；table_rows：按数据量排序。默认按算分排序 ；更新时间、申请量
}

type CommonSearchParam struct {
	Keyword           string         `json:"keyword" binding:"TrimSpace,omitempty,min=1"`                                      // 关键字查询，字符无限制
	DataRange         []int          `json:"data_range,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"4"`     // 数据范围
	UpdateCycle       []int          `json:"update_cycle,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"3,7"` // 更新频率
	SharedType        []int          `json:"shared_type,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"2"`    // 共享条件
	PublishedAt       *TimeRange     `json:"published_at,omitempty" binding:"omitempty"`                                       // 发布时间
	OnlineAt          *TimeRange     `json:"online_at,omitempty" binding:"omitempty"`                                          // 上线时间
	UpdatedAt         *TimeRange     `json:"updated_at,omitempty" binding:"omitempty"`                                         // 更新时间
	IsPublish         *bool          `json:"is_publish,omitempty"`                                                             // 是否发布
	IsOnline          *bool          `json:"is_online,omitempty"`                                                              // 是否上线
	PublishedStatus   []string       `json:"published_status,omitempty" binding:"omitempty"`                                   // 发布状态
	OnlineStatus      []string       `json:"online_status,omitempty" binding:"omitempty"`                                      // 上线状态
	CateInfos         []*CateInfoReq `json:"cate_info,omitempty" binding:"omitempty"`                                          // 类目信息
	IDs               []string       `json:"ids,omitempty"`                                                                    // 待过滤数据资源目录ID列表
	Fields            []string       `json:"fields,omitempty"`                                                                 // 关键字待匹配字段(暂时仅支持配置业务名称及编码)，若无则匹配业务名称、编码、描述、字段
	DataResourceType  []string       `json:"data_resource_type,omitempty"`                                                     // 数据资源类型
	BusinessObjectIDS []string       `json:"business_object_ids,omitempty"`                                                    // 主题域ID
}

type TimeRange struct {
	StartTime *int64 `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64 `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

type SearchDataRescoureseCatalogResp struct {
	Entries             []*ExtSummaryInfo `json:"entries"`
	TotalCount          int64             `json:"total_count"`
	StatisticsRespParam                   // 统计信息，只有当请求query参数中statistics为true且请求body参数中next_flag字段为空时，才会返回该参数
	NextFlag            []string          `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type StatisticsRespParam struct {
	Statistics *statisticsInfo `json:"statistics,omitempty"` // 统计信息
}

type statisticsInfo struct {
	DataKindCount map[int64]int64 `json:"data_kind_count" example:"1:11,2:22"` // 基础信息分类各个类别对应的数量
	// DataRangeCount   map[int64]int64 `json:"data_range_count" example:"1:11,2:22"`   // 数据范围分类各个类别对应的数量
	UpdateCycleCount map[int64]int64 `json:"update_cycle_count" example:"1:11,2:22"` // 更新频率分类各个类别对应的数量
	SharedTypeCount  map[int64]int64 `json:"shared_type_count" example:"1:11,2:22"`  // 共享条件分类各个类别对应的数量
}

type SummaryInfo struct {
	ID                 models.ModelID          `json:"id"`                     // 数据目录ID
	Code               string                  `json:"code"`                   // 数据目录编码
	RawCode            string                  `json:"raw_code"`               // 数据目录编码
	Name               string                  `json:"name"`                   // 数据目录名称，可能存在高亮标签
	RawName            string                  `json:"raw_name"`               // 数据目录名称，不会存在高亮标签
	Description        string                  `json:"description"`            // 数据目录描述，可能存在高亮标签
	RawDescription     string                  `json:"raw_description"`        // 数据目录描述，不会存在高亮标签
	DataKind           []int                   `json:"data_kind"`              // 基础信息分类
	DataRange          int                     `json:"data_range,omitempty"`   // 数据范围
	UpdateCycle        int                     `json:"update_cycle,omitempty"` // 更新频率
	SharedType         int                     `json:"shared_type"`            // 共享条件
	OrgCode            string                  `json:"orgcode"`                // 组织架构ID
	OrgName            string                  `json:"orgname"`                // 组织架构名称
	RawOrgName         string                  `json:"raw_orgname"`
	UpdatedAt          int64                   `json:"updated_at,omitempty"`      // 更新时间
	PublishedAt        int64                   `json:"published_at"`              // 发布时间
	OnlineAt           int64                   `json:"online_at"`                 // 上线时间
	BusinessObjects    []*BusinessObjectEntity `json:"business_objects"`          //业务对象ID数组，里面ID用于左侧树业务域选中节点筛选
	CateInfos          []*CateInfoResp         `json:"cate_info"`                 // 类目信息
	PublishedStatus    string                  `json:"published_status"`          // 发布状态
	OnlineStatus       string                  `json:"online_status"`             // 上线状态
	Fields             []Field                 `json:"fields"`                    // 字段列表，有匹配字段的排在前面
	IsPublish          bool                    `json:"is_publish,omitempty"`      // 是否发布
	IsOnline           bool                    `json:"is_online,omitempty"`       // 是否上线
	MountDataResources []*MountDataResources   `json:"mount_data_resources"`      // 挂接资源
	DataUpdatedAt      int64                   `json:"data_updated_at,omitempty"` // 数据更新时间
	ApplyNum           int                     `json:"apply_num"`                 // 申请量
}

type BusinessObjectEntity struct {
	ID     string `json:"id" binding:"omitempty,uuid" example:"d7549ded-f226-44a2-937a-6731eb256940"` // 业务对象id
	Name   string `json:"name" example:"业务对象名称"`                                                      // 业务对象名称
	Path   string `json:"path"`                                                                       //路径
	PathID string `json:"path_id"`
}

type SearchAllResp struct {
	Entries    []*ExtSummaryInfo `json:"entries"`
	TotalCount int64             `json:"total_count"`
	NextFlag   []string          `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type ExtSummaryInfo struct {
	SummaryInfo
	Fields           []Field `json:"fields"`                       // 字段信息
	DataResourceType string  `json:"data_resource_type,omitempty"` // 数据资源类型
}

type Field struct {
	FieldNameZH    string `json:"field_name_zh"`
	RawFieldNameZH string `json:"raw_field_name_zh"`
	FieldNameEN    string `json:"field_name_en"`
	RawFieldNameEN string `json:"raw_field_name_en"`
}

type CateInfoReq struct {
	CateID  string   `json:"cate_id"`  // 类目类型ID
	NodeIDs []string `json:"node_ids"` // 类目ID
}

type CateInfoResp struct {
	CateID   string `json:"cate_id" binding:"required" example:"00000000-0000-0000-0000-000000000001"` // 类目类型ID
	NodeID   string `json:"node_id" binding:"required" example:"d7549ded-f226-44a2-937a-6731eb256940"` // 类目ID
	NodeName string `json:"node_name" binding:"required,min=1,max=32" example:"类目名称"`                  // 类目名称
	NodePath string `json:"node_path" example:"类目路径"`                                                  // 类目路径
}

type MountDataResources struct {
	DataResourcesType string   `json:"data_resources_type" example:"1"` //数据资源类型
	DataResourcesIdS  []string `json:"data_resources_ids"`              //数据资源id
}

///////////////////////// SearchDataResource /////////////////////////

// SearchDataResourceRequest 定义搜索数据资源的请求
type SearchDataResourceRequest struct {
	Orders   []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`               // 排序，没有keyword时默认以data_updated_at desc & table_rows desc排序，有keyword时默认以_score desc排序
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确

	Keyword       string     `json:"keyword" binding:"TrimSpace,omitempty,min=1"`                       // 关键字查询，字符无限制
	Type          []string   `json:"type,omitempty" binding:"omitempty,unique" example:"data-view,svc"` // 资源
	APIType       string     `json:"api_type,omitempty"`                                                // 接口服务类型
	DataOwnerID   string     `json:"data_owner_id,omitempty" binding:"omitempty,uuid"`                  // 数据资源的 Owner ID。非空时搜索 Owner 是这个用户的数据资源
	DataUpdatedAt *TimeRange `json:"data_updated_at,omitempty" binding:"omitempty"`                     // 数据更新时间
	PublishedAt   *TimeRange `json:"published_at,omitempty" binding:"omitempty"`                        // 发布时间
	OnlineAt      *TimeRange `json:"online_at,omitempty" binding:"omitempty"`                           // 上线时间

	// OrgCode         []string `json:"orgcode,omitempty" binding:"omitempty,unique,dive,min=1" example:"orgCode1,orgCode2"` // 组织架构ID
	// SubjectDomainID []string `json:"subject_domain_id,omitempty" binding:"omitempty,unique" example:"object1,object2"`    // 业务对象ID
	IsPublish       *bool          `json:"is_publish,omitempty"`                           // 是否发布
	IsOnline        *bool          `json:"is_online,omitempty"`                            // 是否上线
	PublishedStatus []string       `json:"published_status,omitempty" binding:"omitempty"` // 发布状态
	OnlineStatus    []string       `json:"online_status,omitempty" binding:"omitempty"`    // 上线状态
	CateInfos       []*CateInfoReq `json:"cate_info,omitempty" binding:"omitempty"`        // 类目信息
	IDs             []string       `json:"ids,omitempty"`                                  // 待过滤资源ID列表
	Fields          []string       `json:"fields,omitempty"`                               // 关键字待匹配字段(暂时仅支持配置业务名称及编码)，若无则匹配业务名称、编码、描述、字段
}

// SearchDataResourceResponse 定义搜索数据资源的返回值
type SearchDataResourceResponse struct {
	Entries    []SearchDataResourceResponseEntry `json:"entries,omitempty"`
	TotalCount int                               `json:"total_count,omitempty"`
	// 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
	NextFlag []string `json:"next_flag,omitempty" example:"0.987,abc"`
}

// SearchDataResourceResponseEntry 定义搜索数据资源返回值中数据资源的结构
type SearchDataResourceResponseEntry struct {
	Type string

	ID             string `json:"id"`              // ID
	Code           string `json:"code"`            // 编码，可能存在高亮标签
	RawCode        string `json:"raw_code"`        // 编码，不会存在高亮标签
	Name           string `json:"name"`            // 业务名称，可能存在高亮标签
	RawName        string `json:"raw_Name"`        // 业务名称，不会存在高亮标签
	NameEn         string `json:"name_en"`         // 技术名称，不会存在高亮标签
	Description    string `json:"description"`     // 描述，可能存在高亮标签
	RawDescription string `json:"raw_description"` // 描述，不会存在高亮标签

	OrgCode     string `json:"orgcode"`      // 组织架构ID
	OrgName     string `json:"orgname"`      // 组织架构名称
	OrgNamePath string `json:"orgname_path"` // 组织架构名称

	PublishedAt int64 `json:"published_at"` // 发布时间
	OnlineAt    int64 `json:"online_at"`    // 上线时间
	IsPublish   bool  `json:"is_publish"`   // 是否发布
	IsOnline    bool  `json:"is_online"`    // 是否上线

	// SubjectDomainID       string `json:"subject_domain_id"`        // 所属主题域的 ID
	// SubjectDomainName     string `json:"subject_domain_name"`      // 所属主题域的名称，即所属主题域的路径的最后一级
	// SubjectDomainNamePath string `json:"subject_domain_name_path"` // 所属主题域的路径

	OwnerName       string          `json:"owner_name"`               // 数据Owner名称
	OwnerID         string          `json:"owner_id"`                 // 数据OwnerID
	Fields          []Field         `json:"fields"`                   // 字段列表，有匹配字段的排在前面
	CateInfos       []*CateInfoResp `json:"cate_info"`                // 类目信息
	PublishedStatus string          `json:"published_status"`         // 发布状态
	OnlineStatus    string          `json:"online_status"`            // 上线状态
	APIType         string          `json:"api_type,omitempty"`       // 接口类型，仅接口有该字段返回
	IndicatorType   string          `json:"indicator_type,omitempty"` // 指标类型，仅指标有该字段返回
	DepartmentId    string          `json:"department_id"`            // 部门ID
	DepartmentName  string          `json:"department_name"`          // 部门名称
	DepartmentPath  string          `json:"department_path"`
}

// UnclassifiedID 代表未分类的 ID，用于搜索不属于任何主题域、部门的数据资源
const UnclassifiedID = "unclassified"

///////////////////////// SearchElecLicence /////////////////////////

type SearchElecLicenceRequest struct {
	CommonSearchParam
	Orders                []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`               // 排序，没有keyword时默认以published_at desc排序，有keyword时默认以_score desc排序
	Size                  int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag              []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
	IndustryDepartments   []string `json:"industry_departments,omitempty"`
	IndustryDepartmentIDs []string `json:"industry_department_ids,omitempty"`
}

type SearchElecLicenceResponse struct {
	Entries    []SearchElecLicenceResponseEntry `json:"entries,omitempty"`
	TotalCount int64                            `json:"total_count,omitempty"`
	// 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
	NextFlag []string `json:"next_flag,omitempty" example:"0.987,abc"`
}

type SearchElecLicenceResponseEntry struct {
	ID                 string   `json:"id"`         // 电子证照目录ID
	Code               string   `json:"code"`       // 电子证照目录编码
	RawCode            string   `json:"raw_code"`   // 电子证照目录编码
	Name               string   `json:"name"`       // 电子证照目录名称，可能存在高亮标签
	RawName            string   `json:"raw_name"`   // 电子证照目录名称，不会存在高亮标签
	UpdatedAt          int64    `json:"updated_at"` // 更新时间
	OnlineAt           int64    `json:"online_at"`  // 上线时间
	IsOnline           bool     `json:"is_online"`
	OnlineStatus       string   `json:"online_status"`                           // 上线状态
	Fields             []*Field `json:"fields"`                                  // 字段列表，有匹配字段的排在前面
	LicenseType        string   `json:"license_type" binding:"omitempty"`        // 证件类型:证照
	CertificationLevel string   `json:"certification_level" binding:"omitempty"` // 发证级别
	HolderType         string   `json:"holder_type" binding:"omitempty"`         // 证照主体
	Expire             string   `json:"expire" binding:"omitempty"`              // 有效期
	Department         string   `json:"department" binding:"omitempty"`          // 管理部门:xx市数据资源管理局
	IndustryDepartment string   `json:"industry_department" binding:"omitempty"` // 行业类别:市场监督
}
