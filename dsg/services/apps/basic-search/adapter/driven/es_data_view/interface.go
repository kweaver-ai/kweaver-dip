package es_data_view

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
)

const (
	ngram = ".ngram"
	graph = ".graph"

	Score            = "_score" // 算分
	ID               = "id"     // ID
	Code             = "code"   //
	Name             = "name"   // 名称
	NameNgram        = Name + ".ngram"
	NameGraph        = Name + ".graph"
	Description      = "description" // 数据目录描述
	DescriptionNgram = Description + ".ngram"
	DescriptionGraph = Description + ".graph"

	OrgCode      = "orgcode" // 组织架构ID
	OrgName      = "orgname" // 组织架构名称
	OrgNameNgram = OrgName + ngram
	OrgNameGraph = OrgName + graph

	SubjectDomainID = "subject_domain_id" // 组织架构ID

	SubjectDomainName      = "subject_domain_name" // 组织架构名称
	SubjectDomainIDNgram   = SubjectDomainID + ngram
	SubjectDomainNameGraph = SubjectDomainName + graph

	DataOwnerName      = "data_owner_name"
	DataOwnerNameGraph = "data_owner_name" + ngram
	DataOwnerNameNgram = "data_owner_name" + graph

	Fields      = "fields"        // 字段
	FieldNameZH = "field_name_zh" // 字段中文名称
	FieldNameEN = "field_name_en" // 字段英文名称

	FieldNameZHNgram = FieldNameZH + ngram
	FieldNameZHGraph = FieldNameZH + graph
	FieldNameENNgram = FieldNameEN + ngram
	FieldNameENGraph = FieldNameEN + graph

	UpdatedAt   = "updated_at"   // 更新时间
	OnlineAt    = "online_at"    // 发布时间
	PublishedAt = "published_at" // 发布时间
)

type ESDataView interface {
	Search(ctx context.Context, param *SearchParam) (*SearchResult, error)
	Index(ctx context.Context, doc *DataViewDoc) error
	Delete(ctx context.Context, id string) error
}

type SearchParam struct {
	BaseSearchParam
	Orders   []Order
	Size     int
	NextFlag []string
}

type BaseSearchParam struct {
	Keyword         string   // 关键字
	OrgCode         []string // 组织架构ID
	SubjectDomainID []string
	PublishedAt     *TimeRange // 上线发布时间
}

type TimeRange struct {
	StartTime *time.Time // 开始时间
	EndTime   *time.Time // 结束时间
}

type Order struct {
	Direction string
	Sort      string
}

type SearchResult struct {
	Items      []SearchResultItem
	TotalCount int64
	NextFlag   []string
}

type SearchResultItem struct {
	BaseObj
	RawName          string `json:"raw_name,omitempty"`
	RawCode          string `json:"raw_code,omitempty"`
	RawDescription   string `json:"raw_description,omitempty"`
	RawOrgName       string `json:"raw_orgname"`
	RawDataOwnerName string `json:"raw_data_owner_name"`
}

type DataViewDoc struct {
	DocID string `json:"doc_id"`
	BaseObj
}

type BaseObj struct {
	ID              string                `json:"id"`      // 逻辑视图id
	Name            string                `json:"name"`    // 逻辑视图名称
	NameEn          string                `json:"name_en"` // 逻辑视图技术名称
	Code            string                `json:"code"`
	Description     string                `json:"description"`     // 逻辑视图描述
	UpdatedAt       int64                 `json:"updated_at"`      // 逻辑视图更新时间
	OnlineAt        int64                 `json:"online_at"`       // 上线时间
	DataOwnerID     string                `json:"data_owner_id"`   // data owner id
	DataOwnerName   string                `json:"data_owner_name"` // data owner 名称
	IsPublish       bool                  `json:"is_publish"`
	PublishedAt     int64                 `json:"published_at"` // 发布时间，时间戳，单位：毫秒
	Fields          []*es_common.Field    `json:"fields"`       // 字段列表
	IsOnline        bool                  `json:"is_online"`
	CateInfo        []*es_common.CateInfo `json:"cate_info"`
	PublishedStatus string                `json:"published_status"`
}
