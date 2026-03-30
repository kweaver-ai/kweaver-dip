package data_catalog

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/cognitive_assistant"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
)

type MountResourceItem struct {
	ResType int8                 `json:"res_type" binding:"required,oneof=1 2"` // 挂接资源类型 1 库表 2文件
	Entries []*MountResourceBase `json:"entries" binding:"required,min=1,unique=ResID,dive"`
}

type MountResourceBase struct {
	ResID   string `json:"res_id,string" binding:"required,min=1"`              // 挂接资源ID
	ResName string `json:"res_name" binding:"required,TrimSpace,min=1,max=255"` // 挂接资源名称
}

type ReqPathParams struct {
	CatalogID models.ModelID `uri:"catalogID" binding:"required,VerifyModelID" example:"1"` // 目录ID
}

type ReqFormParams struct {
	request.BusinessObjectListReqBase
	request.BOPageInfo
}

type ReqTopDataParams struct {
	TopNum    int    `form:"top_num" binding:"required,oneof=5"`                       // 要获取的top数据数量
	Dimension string `form:"dimension" binding:"required,oneof=apply_num preview_num"` // top数据的统计维度
}

////////////////////////////// Search //////////////////////////////

type SearchReqParam struct {
	SearchReqQueryParam `param_type:"query"`
	SearchReqBodyParam  `param_type:"body"`
}

// func (r *SearchReqParam) ToBSSearchParam() (*basic_search.SearchParam, error) {
// 	if (r.InfoSystemID != "" && r.OrgCode != "") ||
// 		(r.OrgCode != "" && r.BusinessObjectID != "") ||
// 		(r.InfoSystemID != "" && r.BusinessObjectID != "") {
// 		return nil, errors.New("info_system_id org_code object_id 字段无法同时生效")
// 	}
// 	return &basic_search.SearchParam{

// 		SearchReqBodyParam: basic_search.SearchReqBodyParam{
// 			CommonSearchParam: basic_search.CommonSearchParam{
// 				Keyword: r.Keyword,

// 				DataRange:   r.DataRange,
// 				UpdateCycle: r.UpdateCycle,
// 				SharedType:  r.SharedType,
// 				//DataUpdatedAt: &basic_search.TimeRange{
// 				//	StartTime: r.DataUpdatedAt.StartTime,
// 				//	EndTime:   r.DataUpdatedAt.EndTime,
// 				//},
// 				PublishedAt: &basic_search.TimeRange{
// 					StartTime: lo.IfF(r.PublishedAt != nil, func() *int64 {
// 						return r.PublishedAt.StartTime
// 					}).Else(nil),
// 					EndTime: lo.IfF(r.PublishedAt != nil, func() *int64 {
// 						return r.PublishedAt.EndTime
// 					}).Else(nil),
// 				},
// 			},
// 			// Orders:   []basic_search.Order{{Sort: "published_at", Direction: "desc"}},
// 			Size:     r.Size,
// 			NextFlag: r.NextFlag,
// 		},
// 	}, nil
// }

const searchDataResourceDatalogRequestSize = 20

// 生成 basic-search 搜索数据资源的请求
func newSearchDataResourcesCatalogRequest(ctx context.Context, keyword string, businessObjectID []string, filter DataCatalogSearchFilter,
	nextFlag NextFlag) *basic_search.SearchReqBodyParam {
	isPublish := true
	isOnline := true
	r := &basic_search.SearchReqBodyParam{
		Size:     searchDataResourceDatalogRequestSize,
		NextFlag: nextFlag,
		CommonSearchParam: basic_search.CommonSearchParam{
			Keyword:          keyword,
			IsPublish:        &isPublish,
			IsOnline:         &isOnline,
			CateInfos:        make([]*basic_search.CateInfoReq, 0),
			DataResourceType: make([]string, len(filter.DataResourceType)),
		},
	}

	// 如果指定了数据资源的类型则配置查询参数: Time
	if len(filter.DataResourceType) > 0 {
		for _, v := range filter.DataResourceType {
			r.DataResourceType = append(r.DataResourceType, strings.ToLower(string(v)))
		}
	}

	// 如果指定了数据资源发布时间的范围则配置查询参数: PublishedAt
	if filter.PublishedAt.Start != nil || filter.PublishedAt.End != nil {
		r.PublishedAt = &basic_search.TimeRange{StartTime: filter.PublishedAt.Start, EndTime: filter.PublishedAt.End}
	}

	// 如果指定了数据资源上线时间的范围则配置查询参数: OnlineAt
	if filter.OnlineAt.Start != nil || filter.OnlineAt.End != nil {
		r.OnlineAt = &basic_search.TimeRange{StartTime: filter.OnlineAt.Start, EndTime: filter.OnlineAt.End}
	}

	// 如果指定了数据资源更新时间的范围则配置查询参数: UpdatedAt
	if filter.UpdatedAt.Start != nil || filter.UpdatedAt.End != nil {
		r.UpdatedAt = &basic_search.TimeRange{StartTime: filter.UpdatedAt.Start, EndTime: filter.UpdatedAt.End}
	}

	if len(filter.CateInfoReq) > 0 {
		r.CateInfos = filter.CateInfoReq
	}

	if len(businessObjectID) > 0 {
		r.BusinessObjectIDS = businessObjectID
	}

	if len(filter.SharedType) > 0 {
		r.SharedType = filter.SharedType
	}

	if len(filter.DataRange) > 0 {
		r.DataRange = filter.DataRange
	}

	if len(filter.UpdateCycle) > 0 {
		r.UpdateCycle = filter.UpdateCycle
	}
	if len(filter.IDs) > 0 {
		r.IDs = filter.IDs
		r.Size = len(filter.IDs)
	}

	if len(filter.Fields) > 0 {
		r.Fields = filter.Fields
	}

	if len(filter.Orders) > 0 {
		r.Orders = filter.Orders
	}

	return r
}

// 生成 basic-search 搜索数据资源的请求
func newSearchForOperDataResourcesCatalogRequest(ctx context.Context, keyword string, businessObjectID []string, filter DataCatalogSearchFilterForOper, nextFlag NextFlag) *basic_search.SearchReqBodyParam {
	request := &basic_search.SearchReqBodyParam{
		Size:     searchDataResourceDatalogRequestSize,
		NextFlag: nextFlag,
		CommonSearchParam: basic_search.CommonSearchParam{
			Keyword:          keyword,
			IsPublish:        filter.IsPublish,
			IsOnline:         filter.IsOnline,
			CateInfos:        make([]*basic_search.CateInfoReq, 0),
			PublishedStatus:  make([]string, len(filter.PublishedStatus)),
			OnlineStatus:     make([]string, len(filter.OnlineStatus)),
			DataResourceType: make([]string, len(filter.DataResourceType)),
		},
	}

	// 如果指定了数据资源的类型则配置查询参数: Time
	if len(filter.DataResourceType) > 0 {
		for _, v := range filter.DataResourceType {
			request.DataResourceType = append(request.DataResourceType, strings.ToLower(string(v)))
		}
	}

	for i := range filter.PublishedStatus {
		request.PublishedStatus[i] = string(filter.PublishedStatus[i])
	}

	for i := range filter.OnlineStatus {
		request.OnlineStatus[i] = string(filter.OnlineStatus[i])
	}

	// 如果指定了数据资源发布时间的范围则配置查询参数: PublishedAt
	if filter.PublishedAt.Start != nil || filter.PublishedAt.End != nil {
		request.PublishedAt = &basic_search.TimeRange{StartTime: filter.PublishedAt.Start, EndTime: filter.PublishedAt.End}
	}

	// 如果指定了数据资源上线时间的范围则配置查询参数: OnlineAt
	if filter.OnlineAt.Start != nil || filter.OnlineAt.End != nil {
		request.OnlineAt = &basic_search.TimeRange{StartTime: filter.OnlineAt.Start, EndTime: filter.OnlineAt.End}
	}

	// 如果指定了数据资源更新时间的范围则配置查询参数: UpdatedAt
	if filter.UpdatedAt.Start != nil || filter.UpdatedAt.End != nil {
		request.UpdatedAt = &basic_search.TimeRange{StartTime: filter.UpdatedAt.Start, EndTime: filter.UpdatedAt.End}
	}

	if len(filter.CateInfoReq) > 0 {
		request.CateInfos = filter.CateInfoReq
	}

	if len(businessObjectID) > 0 {
		request.BusinessObjectIDS = businessObjectID
	}

	if len(filter.SharedType) > 0 {
		request.SharedType = filter.SharedType
	}

	if len(filter.DataRange) > 0 {
		request.DataRange = filter.DataRange
	}

	if len(filter.UpdateCycle) > 0 {
		request.UpdateCycle = filter.UpdateCycle
	}

	if len(filter.IDs) > 0 {
		request.IDs = filter.IDs
		request.Size = len(filter.IDs)
	}

	if len(filter.Fields) > 0 {
		request.Fields = filter.Fields
	}

	if len(filter.Orders) > 0 {
		request.Orders = filter.Orders
	}

	return request
}

type SearchReqQueryParam struct {
}

// Statistics bool `json:"statistics,omitempty" form:"statistics" binding:"omitempty" example:"true"` // 是否返回统计信息，若body参数中next_flag存在，则该参数无效（不会返回统计信息）

type SearchReqBodyParam struct {
	CommonSearchParam
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"`                       // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" binding:"required,oneof=_score data_updated_at table_rows" example:"_score"` // 排序类型，枚举：_score：按算分排序；data_updated_at：按数据更新时间排序；table_rows：按数据量排序。默认按算分排序
}

type CommonSearchParam struct {
	Keyword          string     `json:"keyword" binding:"TrimSpace,omitempty,min=1"`                                      // 关键字查询，字符无限制
	ResourceType     int8       `json:"resource_type" binding:"required,oneof=1 2"`                                       // 资源类型 1逻辑视图 2 接口
	SubjectID        []string   `json:"subject_id" form:"subject_id" binding:"omitempty,dive,uuid"`                       // 所属主题id
	UpdateCycle      []int      `json:"update_cycle,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"3,7"` // 更新频率
	SharedType       []int      `json:"shared_type,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"2"`    // 共享条件
	OrgCode          string     `json:"orgcode,omitempty" binding:"omitempty,uuid" example:"orgCode1,orgCode2"`           // 组织架构ID，用于左侧组织结构树筛选
	BusinessObjectID string     `json:"business_object_id,omitempty" binding:"omitempty,uuid"`                            // 业务对象ID，用于左侧业务域树筛选
	InfoSystemID     string     `json:"info_system_id,omitempty" binding:"omitempty,uuid"`                                // 信息系统ID，用于左侧信息系统列表筛
	PublishedAt      *TimeRange `json:"published_at,omitempty" binding:"omitempty"`                                       // 上线发布时间
}

// DataUpdatedAt *TimeRange `json:"data_updated_at,omitempty" binding:"omitempty"` // 数据更新时间
// DataRange        []int   `json:"data_range,omitempty" binding:"omitempty,max=10,unique,dive,gt=0" example:"4"`       // 数据范围

type TimeRange struct {
	StartTime *int64 `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64 `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

////////////////////////////// SubGraph //////////////////////////////

type SubGraphReqParam struct {
	SubGraphReqBodyParam `param_type:"body"`
}

type SubGraphReqBodyParam struct {
	Start       []string `json:"start" binding:"required"`
	End         string   `json:"end" binding:"required"`
	DataVersion string   `json:"data_version"`
}

func (p SubGraphReqParam) ToSubGraphSearch() *cognitive_assistant.SubGraphReq {
	return &cognitive_assistant.SubGraphReq{
		ServiceName: "asset-subgraph-service",
		End:         p.End,
		Starts:      p.Start,
		DataVersion: p.DataVersion,
	}
}
