package common

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	demand_management_v1 "github.com/kweaver-ai/idrm-go-common/api/demand_management/v1"
)

const ( // 类目类型ID
	CATEGORY_TYPE_ORGANIZATION   = "00000000-0000-0000-0000-000000000001" // 组织架构
	CATEGORY_TYPE_SYSTEM         = "00000000-0000-0000-0000-000000000002" // 信息系统
	CATEGORY_TYPE_SUBJECT_DOMAIN = "00000000-0000-0000-0000-000000000003" // 主题域
)

type TimeRange struct {
	// 以毫秒为单位的时间戳。时间区间的起点，如果未指定则认为起点无限早
	Start *int64 `json:"start"`
	// 以毫秒为单位的时间戳。时间区间的终点，如果未指定则认为终点无限晚
	End *int64 `json:"end"`
}

// 用于过滤未分类、不属于任何主题域的数据资源
const UncategorizedSubjectDomainID = "Uncategorized"

// 用于过滤未分类、不属于任何部门的数据资源
const UncategorizedDepartmentID = "Uncategorized"

// 字段信息，最多三个字段
const SearchResultEntryFieldsMaxLength = 3

type Field struct {
	FieldNameZH    string `json:"field_name_zh" binding:"required,min=1,max=255" example:"高亮字段中文名称"`   // 高亮字段中文名称
	RawFieldNameZH string `json:"raw_field_name_zh" binding:"required,min=1,max=255" example:"字段中文名称"` // 字段中文名称
	FieldNameEN    string `json:"field_name_en" binding:"required,min=1,max=255" example:"name"`       // 高亮字段英文名称
	RawFieldNameEN string `json:"raw_field_name_en" binding:"required,min=1,max=255" example:"name"`   // 字段英文名称
}

// 搜索的过滤器
type Filter struct {

	//类目的 ID，过滤属于类目的数据资源目录
	//  - 未指定、空字符串：不过滤
	//  - Uncategorized：过滤未分类
	CateInfoReq []*basic_search.CateInfoReq `json:"cate_info_req"`
	// 数据资源的类型，过滤这个类型的数据资源
	DataResourceType []common.DataResourceType `json:"data_resource_type"`
	// 过滤这个时间范围内发布的数据资源
	PublishedAt TimeRange `json:"published_at"`
	// 过滤这个时间范围内上线的数据资源
	OnlineAt TimeRange `json:"online_at"`
	// 过滤这个时间范围内上线的数据资源
	UpdatedAt TimeRange `json:"updated_at"`
	// 待过滤的数据资源目录ID列表
	IDs []string `json:"ids"`

	// 关键字待匹配字段，若无则匹配业务名称、编码、描述
	Fields []string `json:"fields"`
	// 排序，不传该参数时：没有keyword时默认以online_at desc & update desc排序，有keyword时默认以_score desc排序
	Orders []basic_search.Order `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`
}

type FilterForOper struct {
	// 运营用户视角过滤的字段
	Filter
	// 是否已发布
	IsPublish *bool `json:"is_publish"`
	// 是否已上线
	IsOnline *bool `json:"is_online"`
	// 发布状态数组
	PublishedStatus []common.DataResourceCatalogPublishStatus `json:"published_status"`
	// 上线状态数组
	OnlineStatus []common.DataResourceCatalogOnlineStatus `json:"online_status"`
	// 过滤这个时间范围内上线的数据资源

}

type NextFlag []string

// 搜索结果
type SearchResult struct {
	// 数据资源列表
	Entries []SearchResultEntry `json:"entries"`
	// 总数量
	TotalCount int64 `json:"total_count"`
	// 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
	NextFlag NextFlag `json:"next_flag"`
}

type SearchResultEntry struct {
	// 数据资源的类型
	DataResourceType int `json:"data_resource_type" binding:"required" example:"1"`
	//挂载的数据资源信息
	MountDataResources []*basic_search.MountDataResources `json:"mount_data_resources"`
	// ID
	ID string `json:"id" binding:"required" example:"3"`

	// 业务名称
	RawName string `json:"raw_name" binding:"required,min=1,max=255" example:"业务名称"`
	// 带有高亮标记的业务名称，如果被关键词命中
	Name string `json:"name" binding:"required,min=1,max=255" example:"带有高亮标记的业务名称"`

	// 编码
	RawCode string `json:"raw_code" binding:"required" example:"SJZYMU20241203/000001"`
	// 带有高亮标记的编码，如果被关键词命中
	Code string `json:"code" binding:"required" example:"SJZYMU20241203/000001"`

	// 描述的首行
	RawDescription string `json:"raw_description" example:"描述的首行"`
	// 带有高亮标记的描述的首行，如果被关键词命中
	Description string `json:"description" example:"带有高亮标记的描述的首行，如果被关键词命中"`

	// 字段的总数
	FieldCount int `json:"field_count" binding:"required" example:"1"`
	// 字段信息，最多三个字段
	Fields      []Field                              `json:"fields"`
	SubjectInfo []*basic_search.BusinessObjectEntity `json:"subject_info"` // 所属主题

	CateInfo []*basic_search.CateInfoResp `json:"cate_info"` // 类目的信息
	// 发布时间戳，以毫秒为单位的时间戳
	PublishedAt int64 `json:"published_at"`
	// 是否已发布
	IsPublish bool `json:"is_publish" binding:"required" example:"false"`
	// 是否已上线
	IsOnline bool `json:"is_online" binding:"required" example:"false"`
	// 发布状态
	PublishedStatus common.DataResourceCatalogPublishStatus `json:"published_status" binding:"required" example:"unpublished"`
	// 上线状态
	OnlineStatus common.DataResourceCatalogOnlineStatus `json:"online_status" binding:"required" example:"notline"`
	// 上线时间戳，以毫秒为单位的时间戳
	OnlineAt int64 `json:"online_at"`

	// 发起搜索的用户可以对这个数据资源执行的动作的列表
	Actions []authServiceV1.Action `json:"actions,omitempty" example:"view"`

	// 共享申请状态
	SharedDeclarationStatus demand_management_v1.SharedDeclarationStatus `json:"shared_declaration_status,omitempty" example:"not_applied"`
}
