package data_search_all

import (
	"context"
	"time"

	"github.com/samber/lo"

	all "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/data_search_all"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/response"
)

type UseCase interface {
	SearchAll(ctx context.Context, req *SearchAllReqParam) (*SearchAllRespParam, error)
}

////////////////////////////// Search //////////////////////////////

type SearchReqParam struct {
	SearchReqQueryParam `param_type:"query"`
	SearchReqBodyParam  `param_type:"body"`
}

func (p *SearchReqParam) ToSearchParam() *all.SearchParam {
	ret := all.SearchParam{
		BaseSearchParam: p.SearchReqBodyParam.commonSearchParam.toESParam(),
		Size:            p.Size,
		NextFlag:        p.NextFlag,
	}

	for _, order := range p.Orders {
		ret.Orders = append(ret.Orders, es_common.Order{
			Direction: order.Direction,
			Sort:      order.Sort,
		})
	}

	return &ret
}

type SearchReqQueryParam struct {
	Statistics bool `json:"statistics,omitempty" form:"statistics" binding:"omitempty" example:"true"` // 是否返回统计信息，若body参数中next_flag存在，则该参数无效（不会返回统计信息）
}

type SearchReqBodyParam struct {
	commonSearchParam
	Orders   []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`               // 排序，没有keyword时默认以data_published_at desc  排序，有keyword时默认以_score desc排序
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"`                                              // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" binding:"required,oneof=_score data_updated_at table_rows published_at online_at" example:"_score"` // 排序类型，枚举：_score：按算分排序；data_updated_at：按数据更新时间排序；table_rows：按数据量排序；online_at：按数据上线时间排序。默认按算分排序
}

type CateInfoR struct {
	CateID string
	NodeID string
}

type commonSearchParam struct {
	IdS             []string              `json:"ids,omitempty" binding:"omitempty,unique" `                              // 资源的ID
	Keyword         string                `json:"keyword" binding:"TrimSpace,omitempty,min=1" example:"keyword"`          // 关键字查询，字符无限制
	Fields          []string              `json:"fields" binding:"omitempty,unique"`                                      // 字段列表。如果非空，关键字仅匹配指定字段
	Type            []string              `json:"type,omitempty" binding:"omitempty,unique" example:"data-view,svc"`      // 资源
	APIType         string                `json:"api_type,omitempty"`                                                     // 接口服务类型
	DataOwnerID     string                `json:"data_owner_id,omitempty" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 数据资源的 Owner ID。非空时搜索 Owner 是这个用户的数据资源
	DataUpdatedAt   *TimeRange            `json:"data_updated_at,omitempty" binding:"omitempty"`                          // 数据更新时间
	PublishedAt     *TimeRange            `json:"published_at,omitempty" binding:"omitempty"`                             // 发布时间
	IsPublish       *bool                 `json:"is_publish,omitempty" example:"false"`                                   // 是否发布，如果为 nil 则不根据发布状态过滤搜索结果
	OnlineAt        *TimeRange            `json:"online_at,omitempty" binding:"omitempty"`                                // 上线时间
	IsOnline        *bool                 `json:"is_online,omitempty" example:"false"`
	PublishedStatus []string              `json:"published_status,omitempty"`
	CateInfo        []es_common.CateInfoR `json:"cate_info,omitempty"`
}

func (p *commonSearchParam) toESParam() all.BaseSearchParam {
	ret := all.BaseSearchParam{
		Keyword: p.Keyword,
		Fields:  p.Fields,
	}

	if p.PublishedAt != nil && (p.PublishedAt.StartTime != nil || p.PublishedAt.EndTime != nil) {
		ret.PublishedAt = &es_common.TimeRange{}

		if p.PublishedAt.StartTime != nil {
			ret.PublishedAt.StartTime = lo.ToPtr(time.UnixMilli(*p.PublishedAt.StartTime))
		}

		if p.PublishedAt.EndTime != nil {
			ret.PublishedAt.EndTime = lo.ToPtr(time.UnixMilli(*p.PublishedAt.EndTime))
		}
	}
	if p.OnlineAt != nil && (p.OnlineAt.StartTime != nil || p.OnlineAt.EndTime != nil) {
		ret.OnlineAt = &es_common.TimeRange{}

		if p.OnlineAt.StartTime != nil {
			ret.OnlineAt.StartTime = lo.ToPtr(time.UnixMilli(*p.OnlineAt.StartTime))
		}

		if p.OnlineAt.EndTime != nil {
			ret.OnlineAt.EndTime = lo.ToPtr(time.UnixMilli(*p.OnlineAt.EndTime))
		}
	}

	return ret
}

type TimeRange struct {
	StartTime *int64 `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64 `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

type SearchRespParam struct {
	response.PageResult[*SummaryInfo]
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type SummaryInfo struct {
	ID              string            `json:"id"`               // ID
	Code            string            `json:"code"`             // 编码，可能存在高亮标签
	RawCode         string            `json:"raw_code"`         // 编码，不会存在高亮标签
	Name            string            `json:"name"`             // 名称，可能存在高亮标签
	NameEn          string            `json:"name_en"`          // 技术名称
	RawName         string            `json:"raw_name"`         // 名称，不会存在高亮标签
	Description     string            `json:"description"`      // 描述，可能存在高亮标签
	RawDescription  string            `json:"raw_description"`  // 描述，不会存在高亮标签
	PublishedAt     int64             `json:"published_at"`     // 发布时间
	IsPublish       bool              `json:"is_publish"`       // 是否已经发布
	OnlineAt        int64             `json:"online_at"`        // 上线时间
	IsOnline        bool              `json:"is_online"`        // 是否已经上线
	OwnerName       string            `json:"owner_name"`       // 数据Owner名称
	OwnerID         string            `json:"owner_id"`         // 数据OwnerID
	Fields          []*FieldEntity    `json:"fields"`           // 字段列表，有匹配字段的排在前面
	PublishedStatus string            `json:"published_status"` // 发布状态
	CateInfo        []*CateInfoEntity `json:"cate_info"`        // 类目的信息
	APIType         string            `json:"api_type"`         // 接口类型
	IndicatorType   string            `json:"indicator_type"`   // 指标类型
}

////////////////////////////// SearchAll //////////////////////////////

type SearchAllReqParam struct {
	SearchReqBodyParam `param_type:"body"`
}

type SearchAllRespParam struct {
	response.PageResult[*ExtSummaryInfo]
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type ExtSummaryInfo struct {
	SummaryInfo
	Type string `json:"type"`
}

func (s *SearchAllReqParam) ToSearchAllParam() *all.SearchParam {

	ret := &all.SearchParam{
		BaseSearchParam: all.BaseSearchParam{
			IdS:             s.IdS,
			Keyword:         s.Keyword,
			Fields:          s.Fields,
			Type:            s.Type,
			APIType:         s.APIType,
			IsPublish:       s.IsPublish,
			IsOnline:        s.IsOnline,
			PublishedStatus: s.PublishedStatus,
			CateInfoR:       s.CateInfo,
			DataOwnerID:     s.DataOwnerID,
		},
		Orders: lo.Map(s.Orders, func(item Order, index int) es_common.Order {
			return es_common.Order{Direction: item.Direction, Sort: item.Sort}
		}),
		Size:     s.Size,
		NextFlag: s.NextFlag,
	}

	if s.PublishedAt != nil && (s.PublishedAt.StartTime != nil || s.PublishedAt.EndTime != nil) {
		ret.PublishedAt = &es_common.TimeRange{}

		if s.PublishedAt.StartTime != nil {
			ret.PublishedAt.StartTime = lo.ToPtr(time.UnixMilli(*s.PublishedAt.StartTime))
		}

		if s.PublishedAt.EndTime != nil {
			ret.PublishedAt.EndTime = lo.ToPtr(time.UnixMilli(*s.PublishedAt.EndTime))
		}
	}

	if s.OnlineAt != nil && (s.OnlineAt.StartTime != nil || s.OnlineAt.EndTime != nil) {
		ret.OnlineAt = &es_common.TimeRange{}

		if s.OnlineAt.StartTime != nil {
			ret.OnlineAt.StartTime = lo.ToPtr(time.UnixMilli(*s.OnlineAt.StartTime))
		}

		if s.OnlineAt.EndTime != nil {
			ret.OnlineAt.EndTime = lo.ToPtr(time.UnixMilli(*s.OnlineAt.EndTime))
		}
	}

	return ret
}

func NewSearchAllRespParam(result *all.SearchResult) *SearchAllRespParam {
	resp := &SearchAllRespParam{
		PageResult: response.PageResult[*ExtSummaryInfo]{
			Entries: lo.Map(result.Items, func(item all.SearchResultItem, _ int) *ExtSummaryInfo {
				return NewExtSummaryInfo(&item)
			}),
			TotalCount: result.TotalCount,
		},
		NextFlag: result.NextFlag,
	}
	return resp
}

func NewExtSummaryInfo(item *all.SearchResultItem) *ExtSummaryInfo {

	return &ExtSummaryInfo{
		SummaryInfo: SummaryInfo{
			ID:              item.ID,
			Code:            item.Code,
			RawCode:         item.RawCode,
			Name:            item.Name,
			RawName:         item.RawName,
			NameEn:          item.NameEn,
			Description:     item.Description,
			RawDescription:  item.RawDescription,
			PublishedAt:     item.PublishedAt.UnixMilli(),
			OnlineAt:        item.OnlineAt.UnixMilli(),
			OwnerName:       item.OwnerName,
			OwnerID:         item.OwnerID,
			IsPublish:       item.IsPublish,
			IsOnline:        item.IsOnline,
			PublishedStatus: item.PubishedStatus,

			Fields: lo.Map(item.Fields, func(f *es_common.Field, _ int) *FieldEntity {
				return &FieldEntity{
					RawFieldNameZH: f.RawFieldNameZH,
					FieldNameZH:    f.FieldNameZH,
					RawFieldNameEN: f.RawFieldNameEN,
					FieldNameEN:    f.FieldNameEN,
				}
			}),
			CateInfo: lo.Map(item.CateInfo, func(f *es_common.CateInfo, _ int) *CateInfoEntity {
				return &CateInfoEntity{
					CateID:   f.CateID,
					NodeID:   f.NodeID,
					NodeName: f.NodeName,
					NodePath: f.NodePath,
				}
			}),

			APIType:       item.APIType,
			IndicatorType: item.IndicatorType,
		},
		Type: item.DocType,
	}
}

type FieldEntity struct {
	RawFieldNameZH string `json:"raw_field_name_zh"`
	FieldNameZH    string `json:"field_name_zh"`
	RawFieldNameEN string `json:"raw_field_name_en"`
	FieldNameEN    string `json:"field_name_en"`
}

type CateInfoEntity struct {
	CateID   string `json:"cate_id"`
	NodeID   string `json:"node_id"`
	NodeName string `json:"node_name"`
	NodePath string `json:"node_path"`
}
