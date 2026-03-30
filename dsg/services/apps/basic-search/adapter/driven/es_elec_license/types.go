package es_elec_license

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
)

const (
	ngram = ".ngram"
	graph = ".graph"

	Score     = "_score" // 算分
	ID        = "id"     // 数据目录ID
	Doc_ID    = "_id"    // DocID
	Name      = "name"   // 数据目录名称
	NameNgram = Name + ngram
	NameGraph = Name + graph
	Code      = "code" // 编码

	DataRange   = "data_range"   // 数据范围
	UpdateCycle = "update_cycle" // 更新频率
	SharedType  = "shared_type"  // 共享条件

	Fields           = "fields"
	FieldNameZH      = "field_name_zh"
	FieldNameZHNgram = "field_name_zh" + ngram
	FieldNameZHGraph = "field_name_zh" + graph
	FieldNameEN      = "field_name_en"
	FieldNameENNgram = "field_name_en" + ngram
	FieldNameENGraph = "field_name_en" + graph

	UpdatedAt    = "updated_at" // 更新时间
	OnlineAt     = "online_at"  // 发布时间
	IsOnline     = "is_online"  // 是否已经上线
	OnlineStatus = "online_status"

	IndustryDepartmentID = "industry_department_id"
)

// interface名称改为名词形式
// type Search interface {
type Searcher interface {
	Search(ctx context.Context, param *SearchParam) (*SearchResult, error)
	Aggs(ctx context.Context, param *AggsParam) (*AggsResult, error)
	Index(ctx context.Context, item *Item) error
	UpdateTableRowsAndUpdatedAt(ctx context.Context, tableId string, tableRows *int64, updatedAt *time.Time) error
	Delete(ctx context.Context, id string) error
}

type TimeRange struct {
	*es_common.TimeRange
}

type SearchParam struct {
	BaseSearchParam

	Orders   []Order
	Size     int
	NextFlag []string // 从该flag后开始获取结果
}

type Order struct {
	Direction string
	Sort      string
}

type BaseSearchParam struct {
	Keyword               string // 关键字
	IdS                   []string
	OnlineAt              *es_common.TimeRange // 上线时间
	IsOnline              *bool
	OnlineStatus          []string
	Fields                []string // 字段列表。如果非空，关键字仅匹配指定字段
	IndustryDepartmentIDs []string // 按照行业进行筛选， 前端传入 industry_department_ids
	IndustryDepartments   []string
}

type SearchResult struct {
	Items      []SearchResultItem
	Total      int64
	NextFlag   []string
	AggsResult *AggsResult
}

type SearchResultItem struct {
	BaseItem
	rawFields
}

type rawFields struct {
	RawName        string `json:"raw_title,omitempty"`
	RawDescription string `json:"raw_description,omitempty"`
	RawCode        string `json:"raw_code,omitempty"`
}

type AggsParam struct {
	BaseSearchParam
}

type AggsResult struct {
	DataKindCount    map[int64]int64
	DataRangeCount   map[int64]int64
	UpdateCycleCount map[int64]int64
	SharedTypeCount  map[int64]int64
}

type Item struct {
	BaseItem
	DocId string `json:"-"` // docId
}

type BaseItem struct {
	ID                   string             `json:"id"`                     // 目录id
	Code                 string             `json:"code"`                   // 目录编码
	Name                 string             `json:"name"`                   // 数据目录名称
	Fields               []*es_common.Field `json:"fields"`                 // 信息项
	LicenseType          string             `json:"license_type"`           // 证件类型:证照
	CertificationLevel   string             `json:"certification_level"`    // 发证级别
	HolderType           string             `json:"holder_type"`            // 证照主体
	Expire               string             `json:"expire"`                 // 有效期
	Department           string             `json:"department"`             // 管理部门:xx市数据资源管理局
	IndustryDepartmentID string             `json:"industry_department_id"` // 行业类别id
	IndustryDepartment   string             `json:"industry_department"`    // 行业类别:市场监督
	UpdatedAt            time.Time          `json:"updated_at,omitempty"`   // 数据更新时间
	OnlineAt             time.Time          `json:"online_at"`              // 上线时间
	IsOnline             bool               `json:"is_online"`              // 是否上线
	OnlineStatus         string             `json:"online_status"`          // 上线状态
}
