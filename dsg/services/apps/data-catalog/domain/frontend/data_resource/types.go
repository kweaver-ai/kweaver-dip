package data_resource

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/sets"
)

// 搜索的过滤器
type Filter struct {
	// 主题域 ID，过滤属于这个主题域的数据资源
	//
	//  - 未指定、空字符串：不过滤
	//  - Uncategorized：过滤未分类、不属于任何主题域的数据资源
	SubjectDomainID string `json:"subject_domain_id"`
	// 部门的 ID，过滤属于这个部门的数据资源
	//
	//  - 未指定、空字符串：不过滤
	//  - Uncategorized：过滤未分类、不属于部门的数据资源
	DepartmentID string `json:"department_id"`
	// 数据资源的类型，过滤这个类型的数据资源
	Type DataResourceType `json:"type"`
	// 过滤接口服务的类型
	APIType APIType `json:"api_type,omitempty"`
	// 过滤这个时间范围内发布的数据资源
	PublishedAt TimeRange `json:"published_at"`
	// 过滤这个时间范围内上线的数据资源
	OnlineAt TimeRange `json:"online_at"`
	// 待过滤的资源ID列表
	IDs []string `json:"ids"`
	// 过滤当前用户拥有权限的数据资源
	//
	//  - true: 过滤当前用户拥有权限的数据资源
	//  - false: 不过滤
	HasPermission bool `json:"has_permission"`
	// 是否过滤数据资源的 Owner 是当前用户的数据资源
	DataOwner bool `json:"data_owner"`
	// 关键字待匹配字段，若无则匹配业务名称、编码、描述
	Fields      []string         `json:"fields"`
	CateInfoReq []*CateInfoParam `json:"cate_info_req"` // 资源属性分类
	// 排序，不传该参数时：没有keyword时默认以data_updated_at desc & table_rows desc排序，有keyword时默认以_score desc排序
	Orders []basic_search.Order `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`
}

type FilterForOper struct {
	// 主题域 ID，过滤属于这个主题域的数据资源
	//
	//  - 未指定、空字符串：不过滤
	//  - Uncategorized：过滤未分类、不属于任何主题域的数据资源
	SubjectDomainID string `json:"subject_domain_id"`
	// 部门的 ID，过滤属于这个部门的数据资源
	//
	//  - 未指定、空字符串：不过滤
	//  - Uncategorized：过滤未分类、不属于部门的数据资源
	DepartmentID string `json:"department_id"`
	// 数据资源的类型，过滤这个类型的数据资源
	Type DataResourceType `json:"type"`
	// 过滤接口服务的类型
	APIType APIType `json:"api_type,omitempty"`
	// 过滤这个时间范围内发布的数据资源
	PublishedAt TimeRange `json:"published_at"`
	// 是否已发布
	IsPublish *bool `json:"is_publish"`
	// 是否已上线
	IsOnline *bool `json:"is_online"`
	// 发布状态数组
	PublishedStatus []DataResourcePublishStatus `json:"published_status"`
	// 上线状态数组
	OnlineStatus []DataResourceOnlineStatus `json:"online_status"`
	// 过滤这个时间范围内上线的数据资源
	OnlineAt TimeRange `json:"online_at"`
	// 待过滤的资源ID列表
	IDs []string `json:"ids"`
	// 关键字待匹配字段，若无则匹配业务名称、编码、描述
	Fields      []string         `json:"fields"`
	CateInfoReq []*CateInfoParam `json:"cate_info_req"` // 资源属性分类
	// 排序，不传该参数时：没有keyword时默认以data_updated_at desc & table_rows desc排序，有keyword时默认以_score desc排序
	Orders []basic_search.Order `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`
}

type CateInfoParam struct {
	CateID  string   `json:"cate_id"`  // 类目类型ID
	NodeIDs []string `json:"node_ids"` // 类目节点ID
}

// 用于过滤未分类、不属于任何主题域的数据资源
const UncategorizedSubjectDomainID = "Uncategorized"

// 用于过滤未分类、不属于任何部门的数据资源
const UncategorizedDepartmentID = "Uncategorized"

// 数据资源类型
type DataResourceType string

const (
	// 数据资源类型：逻辑视图
	DataResourceTypeDataView DataResourceType = "data_view"
	// 数据资源类型：接口
	DataResourceTypeInterface DataResourceType = "interface_svc"
	// 数据资源类型：指标
	DataResourceTypeIndicator DataResourceType = "indicator"
)

// SupportedDataResourceTypes 定义所有支持的数据资源类型
var SupportedDataResourceTypes = sets.New(
	DataResourceTypeDataView,
	DataResourceTypeInterface,
	DataResourceTypeIndicator,
)

// 接口服务类型
type APIType string

const (
	// 注册接口
	APITypeRegister APIType = "service_register"
	// 生成接口
	APITypeGenerate APIType = "service_generate"
)

// dataResourceTypeObjectTypePolicyActionBindings 定义 DataResourceType -
// ObjectType - PolicyAction 之间的关联关系，用于判断当前用户对与资源是否“有权
// 限”
type dataResourceTypeObjectTypePolicyActionBinding struct {
	dataResourceType DataResourceType
	objectType       auth_service.ObjectType
	policyAction     auth_service.PolicyAction
}

// dataResourceTypeToAction 定义 DataResourceType - ObjectType - PolicyAction 映
// 射关系，用于判断当前用户对与资源是否“有权限”
var dataResourceTypeObjectTypePolicyActionBindings = []dataResourceTypeObjectTypePolicyActionBinding{
	// 逻辑视图
	{
		dataResourceType: DataResourceTypeDataView,
		objectType:       auth_service.ObjectTypeDataView,
		policyAction:     auth_service.PolicyActionDownload,
	},
	// 接口
	{
		dataResourceType: DataResourceTypeInterface,
		objectType:       auth_service.ObjectTypeAPI,
		policyAction:     auth_service.PolicyActionRead,
	},
}

// 数据资源发布状态
type DataResourcePublishStatus string

const (
	// 未发布
	DRPS_UNPUBLISHED DataResourcePublishStatus = "unpublished"
	// 发布审核中
	DRPS_PUB_AUDITING DataResourcePublishStatus = "pub-auditing"
	// 已发布
	DRPS_PUBLISHED DataResourcePublishStatus = "published"
	// 发布审核未通过
	DRPS_PUB_REJECT DataResourcePublishStatus = "pub-reject"
	// 变更审核中
	DRPS_CHANGE_AUDITING DataResourcePublishStatus = "change-auditing"
	// 变更审核未通过
	DRPS_CHANGE_REJECT DataResourcePublishStatus = "change-reject"
)

// 数据资源上线状态
type DataResourceOnlineStatus string

const (
	// 未上线
	DROS_NOT_ONLINE DataResourceOnlineStatus = "notline"
	// 已上线
	DROS_ONLINE DataResourceOnlineStatus = "online"
	// 已下线
	DROS_OFFLINE DataResourceOnlineStatus = "offline"
	// 上线审核中
	DROS_UP_AUDITING DataResourceOnlineStatus = "up-auditing"
	// 下线审核中
	DROS_DOWN_AUDITING DataResourceOnlineStatus = "down-auditing"
	// 上线审核未通过
	DROS_UP_REJECT DataResourceOnlineStatus = "up-reject"
	// 下线审核未通过
	DROS_DOWN_REJECT DataResourceOnlineStatus = "down-reject"
)

type TimeRange struct {
	// 以毫秒为单位的时间戳。时间区间的起点，如果未指定则认为起点无限早
	Start *int64 `json:"start"`
	// 以毫秒为单位的时间戳。时间区间的终点，如果未指定则认为终点无限晚
	End *int64 `json:"end"`
}

// 搜索结果
type SearchResult struct {
	// 数据资源列表
	Entries []SearchResultEntry `json:"entries"`
	// 总数量
	TotalCount int `json:"total_count"`
	// 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
	NextFlag NextFlag `json:"next_flag"`
}

type SearchResultEntry struct {
	// 数据资源的类型
	Type DataResourceType `json:"type" binding:"required" example:"1"`
	// ID
	ID string `json:"id" binding:"required" example:"3"`

	// 业务名称
	RawName string `json:"raw_name" binding:"required,min=1,max=255" example:"业务名称"`
	// 带有高亮标记的业务名称，如果被关键词命中
	Name string `json:"name" binding:"required,min=1,max=255" example:"带有高亮标记的业务名称"`

	// 技术名称
	NameEn string `json:"name_en" binding:"required,min=1,max=255" example:"name"`

	// 编码
	RawCode string `json:"raw_code" binding:"required" example:"SJZYMU20241126/000001"`
	// 带有高亮标记的编码，如果被关键词命中
	Code string `json:"code" binding:"required" example:"SJZYMU20241126/000001"`

	// 数据资源 Owner ID
	OwnerID string   `json:"owner_id"`
	Owners  []*Owner `json:"owners"` // 数据Owner

	// 描述的首行
	RawDescription string `json:"raw_description" example:"描述的首行"`
	// 带有高亮标记的描述的首行，如果被关键词命中
	Description string `json:"description" example:"带有高亮标记的描述的首行"`

	// 字段的总数
	FieldCount int `json:"field_count" binding:"required" example:"0"`
	// 字段信息，最多三个字段
	Fields []Field `json:"fields"`

	// 所属主题域的 ID
	SubjectDomainID string `json:"subject_domain_id" binding:"required" example:"0"`
	// 所属主题域的路径，例如：KweaverAI/设计
	SubjectDomainPath string `json:"subject_domain_path" example:"KweaverAI/设计"`
	// 所属主题域的名称，也就是路径的最后一级，例如：设计
	SubjectDomainName string `json:"subject_domain_name" example:"设计"`

	// 所属部门的 ID
	DepartmentID string `json:"department_id" binding:"required" example:"1cba9436-df70-11ee-805f-322e2d859dc5"`
	// 所属部门的路径，例如：KweaverAI/AnyFabric 研发部
	DepartmentPath string `json:"department_path" example:"KweaverAI/AnyFabric 研发部"`
	// 所属部门的名称，也就是路径的最后一级，例如：AnyFabric 研发部
	DepartmentName string `json:"department_name" example:"KweaverAI/AnyFabric 研发部"`

	// 是否拥有此数据资源的权限
	//  - 接口: 调用信息
	//  - 逻辑视图: 信息下载
	HasPermission bool `json:"has_permission" binding:"required" example:"false"`
	// 当前用户对此数据资源可以执行的动作
	Actions []auth_service.PolicyAction `json:"actions,omitempty" example:"view"`

	// 发布时间戳，以毫秒为单位的时间戳
	PublishedAt int64 `json:"published_at"`
	// 是否已发布
	IsPublish bool `json:"is_publish" binding:"required" example:"false"`
	// 是否已上线
	IsOnline bool `json:"is_online" binding:"required" example:"false"`
	// 发布状态
	PublishedStatus DataResourcePublishStatus `json:"published_status" binding:"required" example:"unpublished"`
	// 上线状态
	OnlineStatus DataResourceOnlineStatus `json:"online_status" binding:"required" example:"notline"`
	// 上线时间戳，以毫秒为单位的时间戳
	OnlineAt int64 `json:"online_at"`
	// 接口类型，仅指标有该字段返回
	APIType string `json:"api_type,omitempty"`
	// 指标类型，仅指标有该字段返回
	IndicatorType string                       `json:"indicator_type,omitempty"`
	CateInfos     []*basic_search.CateInfoResp `json:"cate_info"`                 // 类目信息
	FavorID       uint64                       `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored     bool                         `json:"is_favored"`                // 是否已收藏
}
type Owner struct {
	OwnerID   string `json:"owner_id"  form:"owner_id" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据Owner id
	OwnerName string `json:"owner_name,omitempty"`                                                                                   // 数据Owner name
}
type NextFlag []string

// 逻辑视图的字段信息，最多三个字段
const SearchResultEntryFieldsMaxLength = 3

// 字段信息
type Field struct {
	// 技术名称
	RawTechnicalName string `json:"raw_technical_name" binding:"required,min=1,max=255" example:"name"`
	// 带有高亮标记的描述的技术名称，如果被关键词命中
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=255" example:"name"`

	// 业务名称
	RawBusinessName string `json:"raw_business_name" binding:"required,min=1,max=255" example:"name"`
	// 带有高亮标记的描述的技术名称，如果被关键词命中
	BusinessName string `json:"business_name" binding:"required,min=1,max=255" example:"name"`
}
