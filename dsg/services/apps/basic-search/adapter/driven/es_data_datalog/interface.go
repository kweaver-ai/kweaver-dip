package es_data_datalog

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
)

const (
	ngram = ".ngram"
	graph = ".graph"

	Score            = "_score" // 算分
	ID               = "id"     // 数据目录ID
	Doc_ID           = "_id"    // DocID
	Name             = "name"   // 数据目录名称
	NameNgram        = Name + ngram
	NameGraph        = Name + graph
	Code             = "code"        // 编码
	Description      = "description" // 数据目录描述
	DescriptionNgram = Description + ngram
	DescriptionGraph = Description + graph
	DataRange        = "data_range"   // 数据范围
	UpdateCycle      = "update_cycle" // 更新频率
	SharedType       = "shared_type"  // 共享条件
	UpdatedAt        = "updated_at"   // 更新时间
	PublishedAt      = "published_at" // 发布时间
	OnlineAt         = "online_at"    // 发布时间

	DataSourceID        = "data_source_id"
	DataSourceName      = "data_source_name"
	DataSourceNameNgram = DataSourceName + ngram
	DataSourceNameGraph = DataSourceName + graph

	DataOwnerID    = "data_owner_id"
	DataOwnerName  = "data_owner_name"
	OwnerNameNgram = DataOwnerName + ngram
	OwnerNameGraph = DataOwnerName + graph

	BusinessObjects    = "business_objects"
	BusinessObjectName = "business_objects.name"
	BusinessObjectID   = "business_objects.id"

	Fields           = "fields"
	FieldNameZH      = "field_name_zh"
	FieldNameZHNgram = "field_name_zh" + ngram
	FieldNameZHGraph = "field_name_zh" + graph
	FieldNameEN      = "field_name_en"
	FieldNameENNgram = "field_name_en" + ngram
	FieldNameENGraph = "field_name_en" + graph

	IsPublish = "is_publish" // 是否已经发布
	IsOnline  = "is_online"  // 是否已经上线

	PubishedStatus = "published_status"
	OnlineStatus   = "online_status"
	CateInfo       = "cate_info"
	CateID         = "cate_id"
	NodeID         = "node_id"

	DataResourceTypeDataView  = "data_view"
	DataResourceTypeInterface = "interface_svc"
	DataResourceTypeFile      = "file"
)

type Search interface {
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
	Keyword          string // 关键字
	IdS              []string
	DataResourceType []string
	DataRange        []int8 // 数据范围
	UpdateCycle      []int8 // 更新频率
	SharedType       []int8 // 共享条件

	PublishedAt      *es_common.TimeRange // 发布时间
	OnlineAt         *es_common.TimeRange // 上线时间
	UpdatedAt        *es_common.TimeRange // 更新时间
	CateInfoR        []es_common.CateInfoR
	BusinessObjectID []string // 业务对象ID
	IsPublish        *bool    // 是否已经发布
	IsOnline         *bool
	PublishedStatus  []string
	OnlineStatus     []string
	Fields           []string // 字段列表。如果非空，关键字仅匹配指定字段
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
	ID                 string                            `json:"id"`                     // 目录id
	Code               string                            `json:"code"`                   // 目录编码
	Name               string                            `json:"name"`                   // 数据目录名称
	Description        string                            `json:"description,omitempty"`  // 数据目录描述
	DataRange          int8                              `json:"data_range,omitempty"`   // 数据范围
	UpdateCycle        int8                              `json:"update_cycle,omitempty"` // 更新频率
	SharedType         int8                              `json:"shared_type"`            // 共享条件
	UpdatedAt          time.Time                         `json:"updated_at,omitempty"`   // 数据更新时间
	PublishedAt        time.Time                         `json:"published_at"`           // 发布时间
	BusinessObjects    []*es_common.BusinessObjectEntity `json:"business_objects"`       //主题域
	DataOwnerName      string                            `json:"data_owner_name"`        // 数据Owner名称
	DataOwnerID        string                            `json:"data_owner_id"`          // 数据OwnerID
	MountDataResources []*es_common.MountDataResources   `json:"mount_data_resources"`   // 挂接资源
	OnlineAt           time.Time                         `json:"online_at"`              // 上线时间
	IsPublish          bool                              `json:"is_publish"`             // 是否发布
	IsOnline           bool                              `json:"is_online"`              // 是否上线
	CateInfo           []*es_common.CateInfo             `json:"cate_info"`              // 所属类目
	PublishedStatus    string                            `json:"published_status"`       // 发布状态
	OnlineStatus       string                            `json:"online_status"`          // 上线状态
	Fields             []*es_common.Field                `json:"fields"`                 // 字段列表
	// 数据更新时间
	DataUpdatedAt time.Time `json:"data_updated_at,omitempty"`
	// 申请量
	ApplyNum int `json:"apply_num,omitempty"`
}
