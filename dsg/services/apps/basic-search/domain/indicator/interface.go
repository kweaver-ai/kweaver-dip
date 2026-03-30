package indicator

import (
	"context"
	"time"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_indicator"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/response"
)

type UseCase interface {
	Search(ctx context.Context, req *SearchReqParam) (*SearchResp, error)

	IndexToES(ctx context.Context, req *IndexToESReqParam) (*IndexToESRespParam, error)
	DeleteFromES(ctx context.Context, req *DeleteFromESReqParam) (*DeleteFromEsRespParam, error)
}

type SearchReqParam struct {
	SearchReqBodyParam `param_type:"body"`
}

type SearchReqQueryParam struct {
}

type SearchReqBodyParam struct {
	commonSearchParam
	Orders   []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

func (s *SearchReqParam) ToSearchParam() *es.SearchParam {
	ret := &es.SearchParam{
		BaseSearchParam: es.BaseSearchParam{
			Keyword: s.Keyword,
			OrgCode: s.OrgCodes,
		},
		Orders: lo.Map(s.Orders, func(item Order, index int) es.Order {
			return es.Order{Direction: item.Direction, Sort: item.Sort}
		}),
		Size:     lo.If(s.Size == 0, 20).Else(s.Size),
		NextFlag: s.NextFlag,
	}

	if s.PublishedAt != nil && (s.PublishedAt.StartTime != nil || s.PublishedAt.EndTime != nil) {
		ret.PublishedAt = &es.TimeRange{}

		if s.PublishedAt.StartTime != nil {
			ret.PublishedAt.StartTime = lo.ToPtr(time.UnixMilli(*s.PublishedAt.StartTime))
		}

		if s.PublishedAt.EndTime != nil {
			ret.PublishedAt.EndTime = lo.ToPtr(time.UnixMilli(*s.PublishedAt.EndTime))
		}
	}

	return ret
}

type commonSearchParam struct {
	Keyword     string     `json:"keyword" binding:"TrimSpace,omitempty,min=1"` // 搜索关键词，支持字段：接口名称，接口说明
	OrgCodes    []string   `json:"orgcodes" binding:"omitempty,dive,uuid"`      // 接口服务所属组织架构ID
	PublishedAt *TimeRange `json:"published_at,omitempty" binding:"omitempty"`
}

type TimeRange struct {
	StartTime *int64 `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64 `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"` // 排序方向，枚举 asc正序，desc倒序
	Sort      string `json:"sort" binding:"required,oneof=updated_at online_at"`         // 排序类型，枚举 updated_at更新时间 online_at上线时间
}

type IndicatorBaseInfo struct {
	ID               string             `json:"id"`              // 逻辑视图id
	Name             string             `json:"name"`            // 逻辑视图名称，可能存在高亮标签
	RawName          string             `json:"raw_name"`        // 逻辑视图名称，不会存在高亮标签
	Description      string             `json:"description"`     // 逻辑视图描述，可能存在高亮标签
	RawDescription   string             `json:"raw_description"` // 逻辑视图描述，不会存在高亮标签
	UpdatedAt        int64              `json:"updated_at"`      // 逻辑视图更新时间
	PublishedAt      int64              `json:"published_at"`
	OrgCode          string             `json:"orgcode"` // 逻辑视图所属组织架构ID
	OrgName          string             `json:"orgname"` // 接口服务所属组织架构ID
	RawOrgName       string             `json:"raw_orgname"`
	DataOwnerID      string             `json:"owner_id,omitempty"`       // data owner id
	DataOwnerName    string             `json:"owner_name,omitempty"`     // data owner 名称
	RawDataOwnerName string             `json:"raw_owner_name,omitempty"` // data owner 名称
	IsPublish        bool               `json:"is_publish"`
	Fields           []*es_common.Field `json:"fields"` // 字段列表
}

type SearchResp struct {
	response.PageResult[*IndicatorBaseInfo]
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

func NewSearchResp(entries []*IndicatorBaseInfo, total int64, next []string) *SearchResp {
	return &SearchResp{
		response.PageResult[*IndicatorBaseInfo]{
			Entries:    entries,
			TotalCount: total,
		},
		next,
	}
}

type IndexToESReqParam struct {
	DocID                 string                `json:"doc_id"`
	ID                    string                `json:"id"`              // 逻辑视图id
	Code                  string                `json:"code"`            // 逻辑视图编码
	Name                  string                `json:"name"`            // 逻辑视图名称
	Description           string                `json:"description"`     // 逻辑视图描述
	UpdatedAt             int64                 `json:"updated_at"`      // 逻辑视图更新时间
	PublishedAt           int64                 `json:"published_at"`    // 逻辑视图上线时间
	OnlineAt              int64                 `json:"online_at"`       // 逻辑视图上线时间
	OrgCode               string                `json:"orgcode"`         // 逻辑视图所属组织架构ID
	OrgName               string                `json:"orgname"`         // 逻辑视图所属组织架构名称
	DataOwnerID           string                `json:"data_owner_id"`   // data owner id
	DataOwnerName         string                `json:"data_owner_name"` // data owner 名称
	OrgNamePath           string                `json:"orgname_path"`
	SubjectDomainID       string                `json:"subject_domain_id"`
	SubjectDomainName     string                `json:"subject_domain_name"`
	SubjectDomainNamePath string                `json:"subject_domain_name_path"`
	IsPublish             bool                  `json:"is_publish"`
	Fields                []*es_common.Field    `json:"fields"` // 字段列表
	IsOnline              bool                  `json:"is_online"`
	CateInfo              []*es_common.CateInfo `json:"cate_info"`
	PubishedStatus        string                `json:"published_status"`

	// 指标类型
	IndicatorType string `json:"indicator_type,omitempty"`
}

func (i *IndexToESReqParam) ToIndicatorDoc() *es.IndicatorDoc {
	return &es.IndicatorDoc{
		DocID: i.DocID,
		BaseObj: es.BaseObj{
			ID:                    i.ID,
			Name:                  i.Name,
			Code:                  i.Code,
			Description:           i.Description,
			UpdatedAt:             i.UpdatedAt,
			OrgName:               i.OrgName,
			PublishedAt:           i.PublishedAt,
			OrgCode:               i.OrgCode,
			DataOwnerID:           i.DataOwnerID,
			DataOwnerName:         i.DataOwnerName,
			OrgNamePath:           i.OrgNamePath,
			SubjectDomainID:       i.SubjectDomainID,
			SubjectDomainName:     i.SubjectDomainName,
			SubjectDomainNamePath: i.SubjectDomainNamePath,
			IsPublish:             i.IsPublish,
			Fields:                i.Fields,
			OnlineAt:              i.OnlineAt,
			PublishedStatus:       i.PubishedStatus,
			CateInfo:              i.CateInfo,
			IsOnline:              i.IsOnline,
			IndicatorType:         i.IndicatorType,
		},
	}
}

type IndexToESRespParam struct {
	ID string
}

type DeleteFromESReqParam struct {
	ID string
}
type DeleteFromEsRespParam struct {
	ID string
}
