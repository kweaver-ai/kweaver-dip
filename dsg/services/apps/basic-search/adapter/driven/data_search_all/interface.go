package data_search_all

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
)

const (
	ngram = ".ngram"
	graph = ".graph"

	Score = "_score" // 算分

	Doc_ID = "_id"

	ID = "id" // ID

	Name      = "name" // 名称
	NameNgram = Name + ".ngram"
	NameGraph = Name + ".graph"

	Code = "code" // 编码

	Description      = "description" // 描述
	DescriptionNgram = Description + ngram
	DescriptionGraph = Description + graph

	PublishedAt = "published_at" // 发布时间
	OnlineAt    = "online_at"    // 发布时间
	// Deprecated: Use DataOwnerID instead.
	OwnerID     = "owner_id"
	DataOwnerID = "data_owner_id" // 数据 Owner ID

	IsPublish = "is_publish" // 是否已经发布
	IsOnline  = "is_online"  // 是否已经上线

	PubishedStatus = "published_status"
	CateInfo       = "cate_info"
	CateID         = "cate_id"
	NodeID         = "node_id"

	OrgCode = "orgcode" // 组织架构ID
	//OrgName      = "orgname" // 组织架构名称
	//OrgNameNgram = OrgName + ngram
	//OrgNameGraph = OrgName + graph

	Fields      = "fields"        // 字段
	FieldNameZH = "field_name_zh" // 字段中文名称
	FieldNameEN = "field_name_en" // 字段英文名称

	FieldNameZHNgram = FieldNameZH + ngram
	FieldNameZHGraph = FieldNameZH + graph
	FieldNameENNgram = FieldNameEN + ngram
	FieldNameENGraph = FieldNameEN + graph

	// 接口服务类型
	InterfaceSVC = "interface_svc"
	// 逻辑视图类型
	DataView = "data_view"
	// 指标类型
	Indicator = "indicator"

	// 接口类型
	APIType = "api_type"
)

// EsAll 跨索引搜索全部指定索引
type EsAll interface {
	Search(ctx context.Context, param *SearchParam) (*SearchResult, error)
}

type TimeRange struct {
	*es_common.TimeRange
}

type Item struct {
	BaseDoc
	DocId string `json:"-"` // docId
}

type SearchParam struct {
	BaseSearchParam
	Orders   []es_common.Order
	Size     int
	NextFlag []string
}

type BaseSearchParam struct {
	IdS             []string
	Keyword         string   // 关键字
	Fields          []string // 字段列表。如果非空，关键字仅匹配指定字段
	Type            []string
	APIType         string               // 接口服务类型
	DataOwnerID     string               // 数据资源的 Owner ID。非空时搜索 Owner 是这个用户的数据资源
	PublishedAt     *es_common.TimeRange // 发布时间
	OnlineAt        *es_common.TimeRange // 上线时间
	CateInfoR       []es_common.CateInfoR
	IsPublish       *bool // 是否已经发布
	IsOnline        *bool
	PublishedStatus []string
}

type SearchResult struct {
	Items      []SearchResultItem
	TotalCount int64
	NextFlag   []string
}

type SearchResultItem struct {
	DocType string `json:"doc_type"`
	BaseDoc
	rawFields
}

type rawFields struct {
	RawName        string `json:"raw_name,omitempty"`
	RawDescription string `json:"raw_description,omitempty"`
	RawCode        string `json:"raw_code,omitempty"`
}

type BaseDoc struct {
	ID             string                `json:"id"`                    // id
	Code           string                `json:"code"`                  // 编码
	Name           string                `json:"name"`                  // 名称
	NameEn         string                `json:"name_en"`               // 技术名称
	Description    string                `json:"description,omitempty"` // 描述
	PublishedAt    time.Time             `json:"published_at"`          // 发布时间
	OwnerID        string                `json:"owner_id"`              // 数据OwnerID
	OwnerName      string                `json:"owner_name"`            // 数据Owner名称
	IsPublish      bool                  `json:"is_publish"`            // 是否已发布
	Fields         []*es_common.Field    `json:"fields"`                // 字段列表
	OnlineAt       time.Time             `json:"online_at"`             // 上线时间
	IsOnline       bool                  `json:"is_online"`             // 是否已上线
	CateInfo       []*es_common.CateInfo `json:"cate_info"`             // 类目信息
	PubishedStatus string                `json:"published_status"`      // 发布状态
	APIType        string                `json:"api_type"`              // 接口类型
	IndicatorType  string                `json:"indicator_type"`        // 指标类型
}
