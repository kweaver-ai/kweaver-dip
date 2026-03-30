package es_interface_svc

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
	Name             = "name"   // 数据目录名称
	Code             = "code"   // 数据目录名称
	NameNgram        = Name + ".ngram"
	NameGraph        = Name + ".graph"
	Description      = "description" // 数据目录描述
	DescriptionNgram = Description + ".ngram"
	DescriptionGraph = Description + ".graph"

	OrgCode      = "orgcode" // 组织架构ID
	OrgName      = "orgname" // 组织架构名称
	OrgNameNgram = OrgName + ngram
	OrgNameGraph = OrgName + graph

	DataOwnerName      = "data_owner_name"
	DataOwnerNameGraph = "data_owner_name" + ngram
	DataOwnerNameNgram = "data_owner_name" + graph
	SubjectDomainID    = "subject_domain_id"

	Fields      = "fields"        // 字段
	FieldNameZH = "field_name_zh" // 字段中文名称
	FieldNameEN = "field_name_en" // 字段英文名称

	FieldNameZHNgram = FieldNameZH + ngram
	FieldNameZHGraph = FieldNameZH + graph
	FieldNameENNgram = FieldNameEN + ngram
	FieldNameENGraph = FieldNameEN + graph

	UpdatedAt = "updated_at" // 发布时间
	OnlineAt  = "online_at"  // 上线时间
)

type ESInterfaceSvc interface {
	Search(ctx context.Context, param *SearchParam) (*SearchResult, error)
	Index(ctx context.Context, doc *InterfaceSvcDoc) error
	Delete(ctx context.Context, id string) error

	// UpdateUpdatedAt(ctx context.Context, docID string, updatedAt *time.Time) error
}

type SearchParam struct {
	BaseSearchParam
	Orders   []Order
	Size     int
	NextFlag []string
}

type BaseSearchParam struct {
	Keyword  string     // 关键字
	OrgCode  []string   // 组织架构ID
	OnlineAt *TimeRange // 上线发布时间
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

type InterfaceSvcDoc struct {
	DocID string `json:"doc_id"`
	BaseObj
}

/*
	{
		"id": "470987429516416196",
		"name": "项目总体进度情况分析",
		"description": "项目总体进度情况分析的相关数据",
		"data_source_id": "470968845864015054",
		"data_source_name": "演示数据库",
		"orgcode": "9de59e38-250e-11ee-a420-6aa2d4f31938",
		"orgname": "总经理",
		"updated_at": 1690260039412
		"online_at": 1690260039412
	},
*/

type BaseObj struct {
	ID              string                `json:"id"` // 接口服务id
	Code            string                `json:"code"`
	Name            string                `json:"name"`            // 接口服务名称
	Description     string                `json:"description"`     // 接口服务描述
	UpdatedAt       int64                 `json:"updated_at"`      // 接口服务更新时间
	OnlineAt        int64                 `json:"online_at"`       // 接口服务上线时间
	DataOwnerID     string                `json:"data_owner_id"`   // data owner id
	DataOwnerName   string                `json:"data_owner_name"` // data owner 名称
	IsPublish       bool                  `json:"is_publish"`
	PublishedAt     int64                 `json:"published_at"` // 接口发布时间，时间戳，单位：毫秒
	Fields          []*es_common.Field    `json:"fields"`       // 字段列表
	IsOnline        bool                  `json:"is_online"`
	CateInfo        []*es_common.CateInfo `json:"cate_info"`
	PublishedStatus string                `json:"published_status"`
	APIType         string                `json:"api_type"`
}
