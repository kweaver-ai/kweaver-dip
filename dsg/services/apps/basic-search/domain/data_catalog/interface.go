package data_catalog

import (
	"context"
	"time"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_data_datalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/response"
)

type UseCase interface {
	Search(ctx context.Context, req *SearchReqParam) (*SearchRespParam, error)
	Statistics(ctx context.Context, req *StatisticsReqParam) (*StatisticsRespParam, error)
	IndexToES(ctx context.Context, req *IndexToESReqParam) (*IndexToESRespParam, error)
	DeleteFromES(ctx context.Context, req *DeleteFromESReqParam) (*DeleteFromESRespParam, error)
}

////////////////////////////// Search //////////////////////////////

type SearchReqParam struct {
	SearchReqQueryParam `param_type:"query"`
	SearchReqBodyParam  `param_type:"body"`
}

func (p *SearchReqParam) ToSearchParam() *es.SearchParam {

	ret := es.SearchParam{

		BaseSearchParam: p.SearchReqBodyParam.commonSearchParam.toESParam(),
		Size:            p.Size,
		NextFlag:        p.NextFlag,
	}

	for _, order := range p.Orders {
		ret.Orders = append(ret.Orders, es.Order{
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
	Orders   []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`               // 排序，没有keyword时默认以data_updated_at desc & table_rows desc排序，有keyword时默认以_score desc排序
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"`                                                        // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" binding:"required,oneof=_score updated_at online_at published_at apply_num data_updated_at" example:"_score"` // 排序类型，枚举：_score：按算分排序；data_updated_at：按数据更新时间排序；table_rows：按数据量排序；apply_num：按申请量排序。默认按算分排序
}

type commonSearchParam struct {
	IdS               []string              `json:"ids,omitempty" binding:"omitempty,unique" `                                        // 资源目录的ID
	Keyword           string                `json:"keyword" binding:"TrimSpace,omitempty,min=1" example:"keyword"`                    // 关键字查询，字符无限制
	DataRange         []int8                `json:"data_range,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"4"`     // 数据范围
	UpdateCycle       []int8                `json:"update_cycle,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"3,7"` // 更新频率
	SharedType        []int8                `json:"shared_type,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"2"`    // 共享条件
	UpdatedAt         *TimeRange            `json:"updated_at,omitempty" binding:"omitempty"`                                         // 更新时间
	PublishedAt       *TimeRange            `json:"published_at,omitempty" binding:"omitempty"`                                       // 发布时间
	OnlineAt          *TimeRange            `json:"online_at,omitempty" binding:"omitempty"`                                          // 上线时间
	IsPublish         *bool                 `json:"is_publish,omitempty" example:"false"`                                             // 是否发布，如果为 nil 则不根据发布状态过滤搜索结果
	IsOnline          *bool                 `json:"is_online,omitempty" example:"false"`
	DataResourceType  []string              `json:"data_resource_type,omitempty"`
	PublishedStatus   []string              `json:"published_status,omitempty"`
	OnlineStatus      []string              `json:"online_status,omitempty"`
	CateInfo          []es_common.CateInfoR `json:"cate_info,omitempty"`
	Fields            []string              `json:"fields" binding:"omitempty,unique"` // 字段列表。如果非空，关键字仅匹配指定字段
	BusinessObjectIDS []string              `json:"business_object_ids"`
}

func (p *commonSearchParam) toESParam() es.BaseSearchParam {
	ret := es.BaseSearchParam{
		Keyword:          p.Keyword,
		Fields:           p.Fields,
		DataRange:        p.DataRange,
		UpdateCycle:      p.UpdateCycle,
		SharedType:       p.SharedType,
		BusinessObjectID: p.BusinessObjectIDS,
		IdS:              p.IdS,
		DataResourceType: p.DataResourceType,
		IsPublish:        p.IsPublish,
		IsOnline:         p.IsOnline,
		PublishedStatus:  p.PublishedStatus,
		OnlineStatus:     p.OnlineStatus,
		CateInfoR:        p.CateInfo,
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
	if p.UpdatedAt != nil && (p.UpdatedAt.StartTime != nil || p.UpdatedAt.EndTime != nil) {
		ret.UpdatedAt = &es_common.TimeRange{}

		if p.UpdatedAt.StartTime != nil {
			ret.UpdatedAt.StartTime = lo.ToPtr(time.UnixMilli(*p.UpdatedAt.StartTime))
		}

		if p.UpdatedAt.EndTime != nil {
			ret.UpdatedAt.EndTime = lo.ToPtr(time.UnixMilli(*p.UpdatedAt.EndTime))
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
	StatisticsRespParam          // 统计信息，只有当请求query参数中statistics为true且请求body参数中next_flag字段为空时，才会返回该参数
	NextFlag            []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

func NewSearchRespParam(result *es.SearchResult) *SearchRespParam {
	return &SearchRespParam{
		PageResult: response.PageResult[*SummaryInfo]{
			Entries: lo.Map(result.Items, func(item es.SearchResultItem, _ int) *SummaryInfo {
				return NewSummaryInfo(&item)
			}),
			TotalCount: result.Total,
		},
		StatisticsRespParam: *NewStatisticsRespParam(result.AggsResult),
		NextFlag:            result.NextFlag,
	}
}

type SummaryInfo struct {
	ID                 string                            `json:"id"`                   // 数据目录ID
	Code               string                            `json:"code"`                 // 数据目录编码
	RawCode            string                            `json:"raw_code"`             // 数据目录编码
	Name               string                            `json:"name"`                 // 数据目录名称，可能存在高亮标签
	RawName            string                            `json:"raw_name"`             // 数据目录名称，不会存在高亮标签
	Description        string                            `json:"description"`          // 数据目录描述，可能存在高亮标签
	RawDescription     string                            `json:"raw_description"`      // 数据目录描述，不会存在高亮标签
	DataRange          int8                              `json:"data_range"`           // 数据范围
	UpdateCycle        int8                              `json:"update_cycle"`         // 更新频率
	SharedType         int8                              `json:"shared_type"`          // 共享条件
	UpdatedAt          int64                             `json:"updated_at"`           // 更新时间
	PublishedAt        int64                             `json:"published_at"`         // 发布时间
	OnlineAt           int64                             `json:"online_at"`            // 上线时间
	BusinessObjects    []*es_common.BusinessObjectEntity `json:"business_objects"`     //业务对象ID数组，里面ID用于左侧树业务域选中节点筛选
	Fields             []*es_common.Field                `json:"fields"`               // 字段列表，有匹配字段的排在前面
	CateInfo           []*es_common.CateInfo             `json:"cate_info"`            // 类目的信息
	MountDataResources []*es_common.MountDataResources   `json:"mount_data_resources"` // 挂接的数据资源
	IsPublish          bool                              `json:"is_publish"`
	IsOnline           bool                              `json:"is_online"`
	PublishedStatus    string                            `json:"published_status"` // 发布状态
	OnlineStatus       string                            `json:"online_status"`    // 上线状态
	// 数据更新时间
	DataUpdatedAt time.Time `json:"data_updated_at,omitempty"`
	// 申请量
	ApplyNum int `json:"apply_num,omitempty"`
}

func NewSummaryInfo(item *es.SearchResultItem) *SummaryInfo {
	return &SummaryInfo{
		ID:              item.ID,
		Code:            item.Code,
		RawCode:         item.RawCode,
		Name:            item.Name,
		RawName:         item.RawName,
		Description:     item.Description,
		RawDescription:  item.RawDescription,
		DataRange:       item.DataRange,
		UpdateCycle:     item.UpdateCycle,
		SharedType:      item.SharedType,
		PublishedAt:     item.PublishedAt.UnixMilli(),
		OnlineAt:        item.OnlineAt.UnixMilli(),
		UpdatedAt:       item.UpdatedAt.UnixMilli(),
		OnlineStatus:    item.OnlineStatus,
		PublishedStatus: item.PublishedStatus,
		IsPublish:       item.IsPublish,
		IsOnline:        item.IsOnline,

		BusinessObjects: lo.Map(item.BusinessObjects, func(item *es_common.BusinessObjectEntity, _ int) *es_common.BusinessObjectEntity {
			return &es_common.BusinessObjectEntity{ID: item.ID, Name: item.Name, Path: item.Path, PathID: item.PathID}
		}),

		CateInfo: lo.Map(item.CateInfo, func(f *es_common.CateInfo, _ int) *es_common.CateInfo {
			return &es_common.CateInfo{
				CateID:   f.CateID,
				NodeID:   f.NodeID,
				NodeName: f.NodeName,
				NodePath: f.NodePath,
			}
		}),

		MountDataResources: lo.Map(item.MountDataResources, func(f *es_common.MountDataResources, _ int) *es_common.MountDataResources {

			return &es_common.MountDataResources{
				DataResourcesType: f.DataResourcesType,
				DataResourcesIdS:  f.DataResourcesIdS,
			}
		}),

		Fields: lo.Map(item.Fields, func(f *es_common.Field, _ int) *es_common.Field {
			return &es_common.Field{
				RawFieldNameZH: f.RawFieldNameZH,
				FieldNameZH:    f.FieldNameZH,
				RawFieldNameEN: f.RawFieldNameEN,
				FieldNameEN:    f.FieldNameEN,
			}
		}),

		DataUpdatedAt: item.DataUpdatedAt,
		ApplyNum:      item.ApplyNum,
	}
}

////////////////////////////// Statistics //////////////////////////////

type StatisticsReqParam struct {
	StatisticsReqBodyParam `param_type:"body"`
}

func (p *StatisticsReqParam) ToAggsParam() *es.AggsParam {
	return &es.AggsParam{
		BaseSearchParam: p.StatisticsReqBodyParam.commonSearchParam.toESParam(),
	}
}

type StatisticsReqBodyParam struct {
	commonSearchParam
}

type StatisticsRespParam struct {
	Statistics *statisticsInfo `json:"statistics,omitempty"` // 统计信息
}

func NewStatisticsRespParam(result *es.AggsResult) *StatisticsRespParam {
	if result == nil {
		return &StatisticsRespParam{}
	}

	return &StatisticsRespParam{
		Statistics: &statisticsInfo{
			DataKindCount:    result.DataKindCount,
			DataRangeCount:   result.DataRangeCount,
			UpdateCycleCount: result.UpdateCycleCount,
			SharedTypeCount:  result.SharedTypeCount,
		},
	}
}

type statisticsInfo struct {
	DataKindCount    map[int64]int64 `json:"data_kind_count" example:"1:11,2:22"`    // 基础信息分类各个类别对应的数量
	DataRangeCount   map[int64]int64 `json:"data_range_count" example:"1:11,2:22"`   // 数据范围分类各个类别对应的数量
	UpdateCycleCount map[int64]int64 `json:"update_cycle_count" example:"1:11,2:22"` // 更新频率分类各个类别对应的数量
	SharedTypeCount  map[int64]int64 `json:"shared_type_count" example:"1:11,2:22"`  // 共享条件分类各个类别对应的数量
}

////////////////////////////// IndexToES //////////////////////////////

type IndexToESReqParam struct {
	DocId              string                            `json:"docid,omitempty"`                               // doc id
	ID                 string                            `json:"id"`                                            // 目录id
	Code               string                            `json:"code"`                                          // 目录编码
	Name               string                            `json:"name"`                                          // 数据目录名称
	Description        string                            `json:"description,omitempty"`                         // 数据目录描述
	DataRange          int8                              `json:"data_range,omitempty"`                          // 数据范围
	UpdateCycle        int8                              `json:"update_cycle,omitempty"`                        // 更新频率
	SharedType         int8                              `json:"shared_type"`                                   // 共享条件
	DataUpdatedAt      int64                             `json:"data_updated_at,omitempty"`                     // 数据更新时间
	UpdatedAt          int64                             `json:"updated_at,omitempty" binding:"omitempty,gt=0"` // 数据目录更新时间
	PublishedAt        int64                             `json:"published_at"`                                  // 发布时间
	BusinessObjects    []*es_common.BusinessObjectEntity `json:"business_objects"`                              //主题域
	DataOwnerName      string                            `json:"data_owner_name"`                               // 数据Owner名称
	DataOwnerID        string                            `json:"data_owner_id"`                                 // 数据OwnerID
	MountDataResources []*es_common.MountDataResources   `json:"mount_data_resources"`                          // 挂接资源
	OnlineAt           int64                             `json:"online_at"`                                     // 上线时间
	IsPublish          bool                              `json:"is_publish"`                                    // 是否发布
	IsOnline           bool                              `json:"is_online"`                                     // 是否上线
	CateInfo           []*es_common.CateInfo             `json:"cate_info"`                                     // 所属类目
	PublishedStatus    string                            `json:"published_status"`                              // 发布状态
	OnlineStatus       string                            `json:"online_status"`                                 // 上线状态
	Fields             []*es_common.Field                `json:"fields"`                                        // 字段列表
	// 申请量
	ApplyNum int `json:"apply_num,omitempty"`
}

func (p *IndexToESReqParam) ToItem() *es.Item {
	ret := es.Item{
		BaseItem: es.BaseItem{
			ID:                 p.ID,
			Code:               p.Code,
			Name:               p.Name,
			Description:        p.Description,
			DataRange:          p.DataRange,
			UpdateCycle:        p.UpdateCycle,
			SharedType:         p.SharedType,
			PublishedAt:        time.UnixMilli(p.PublishedAt),
			UpdatedAt:          time.UnixMilli(p.UpdatedAt),
			IsPublish:          p.IsPublish,
			Fields:             p.Fields,
			IsOnline:           p.IsOnline,
			OnlineAt:           time.UnixMilli(p.OnlineAt),
			PublishedStatus:    p.PublishedStatus,
			OnlineStatus:       p.OnlineStatus,
			CateInfo:           p.CateInfo,
			MountDataResources: p.MountDataResources,
			BusinessObjects: lo.Map(p.BusinessObjects, func(item *es_common.BusinessObjectEntity, index int) *es_common.BusinessObjectEntity {
				return &es_common.BusinessObjectEntity{ID: item.ID, Name: item.Name, Path: item.Path, PathID: item.PathID}
			}),
			DataUpdatedAt: time.UnixMilli(p.DataUpdatedAt),
			ApplyNum:      p.ApplyNum,
		},
		DocId: p.DocId,
	}

	return &ret
}

type IndexToESRespParam struct {
	ID string
}

func NewIndexToESRespParam(id string) *IndexToESRespParam {
	return &IndexToESRespParam{ID: id}
}

////////////////////////////// UpdateTableRowsAndUpdatedAt //////////////////////////////

type UpdateTableRowsAndUpdatedAtReqParam struct {
	TableId       string `json:"table_id,omitempty"`   // 库表ID
	TableRows     *int64 `json:"table_rows,omitempty"` // 数据量
	DataUpdatedAt *int64 `json:"updated_at,omitempty"` // 数据更新时间
}

////////////////////////////// DeleteFromES //////////////////////////////

type DeleteFromESReqParam struct {
	ID string
}

type DeleteFromESRespParam struct {
	ID string
}

func NewDeleteFromESRespParam(id string) *DeleteFromESRespParam {
	return &DeleteFromESRespParam{ID: id}
}
