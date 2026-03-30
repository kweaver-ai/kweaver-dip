package elec_license

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	es "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_elec_license" //电子证照目录
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/response"
	"github.com/samber/lo"
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

// 将 SearchReqParam 转成 SearchParam ， 做了时间类型的转换，对排序字段Orders进行了处理
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

// Query 参数
type SearchReqQueryParam struct {
	Statistics bool `json:"statistics,omitempty" form:"statistics" binding:"omitempty" example:"true"` // 是否返回统计信息，若body参数中next_flag存在，则该参数无效（不会返回统计信息）
}

// Body 参数
type SearchReqBodyParam struct {
	commonSearchParam
	Orders   []Order  `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`               // 排序，没有keyword时默认以data_updated_at desc & table_rows desc排序，有keyword时默认以_score desc排序
	Size     int      `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag []string `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

// 排序请求
type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"`                               // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" binding:"required,oneof=_score updated_at online_at  published_at" example:"_score"` // 排序类型，枚举：_score：按算分排序；data_updated_at：按数据更新时间排序；table_rows：按数据量排序。默认按算分排序
}

// 除了Ids和Keyword之外,都是筛选项字段
type commonSearchParam struct {
	IdS                   []string   `json:"ids,omitempty" binding:"omitempty,unique" `     // 资源目录的ID
	Keyword               string     `json:"keyword" binding:"TrimSpace,omitempty,min=1"`   // 关键字查询，字符无限制
	UpdatedAt             *TimeRange `json:"data_updated_at,omitempty" binding:"omitempty"` // 更新时间
	OnlineAt              *TimeRange `json:"online_at,omitempty" binding:"omitempty"`       // 上线时间
	IsOnline              *bool      `json:"is_online,omitempty"`
	OnlineStatus          []string   `json:"online_status,omitempty"`
	Fields                []string   `json:"fields" binding:"omitempty,unique"` // 字段列表。如果非空，关键字仅匹配指定字段
	IndustryDepartmentIDs []string   `json:"industry_department_ids,omitempty"`
	IndustryDepartments   []string   `json:"industry_departments,omitempty"`
}

// 将commonSearchParam 转成 BaseSearchParam，其中要做时间类型的转换
func (p *commonSearchParam) toESParam() es.BaseSearchParam {
	ret := es.BaseSearchParam{
		IdS:                   p.IdS,
		Keyword:               p.Keyword,
		IsOnline:              p.IsOnline,
		OnlineStatus:          p.OnlineStatus,
		Fields:                p.Fields,
		IndustryDepartmentIDs: p.IndustryDepartmentIDs,
		IndustryDepartments:   p.IndustryDepartments,
	}

	//if p.PublishedAt != nil && (p.PublishedAt.StartTime != nil || p.PublishedAt.EndTime != nil) {
	//	ret.PublishedAt = &es_common.TimeRange{}
	//
	//	if p.UpdatedAt.StartTime != nil {
	//		ret.PublishedAt.StartTime = lo.ToPtr(time.UnixMilli(*p.PublishedAt.StartTime))
	//		//	lo.ToPtr:返回一个指向值的指针的拷贝。
	//	}
	//
	//	if p.UpdatedAt.EndTime != nil {
	//		ret.PublishedAt.EndTime = lo.ToPtr(time.UnixMilli(*p.PublishedAt.EndTime))
	//	}
	//}
	// OnlineAt是指针类型,StartTime,EndTime也都是指针类型
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

// es_common 中的TimeRange，时间类型是time.Time, 这里是毫秒时间戳
type TimeRange struct {
	StartTime *int64 `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64 `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

////////////////////////////// Search Response //////////////////////////////

// 搜索响应参数
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
	ID                   string             `json:"id"`         // 电子证照目录ID
	Code                 string             `json:"code"`       // 电子证照目录编码
	RawCode              string             `json:"raw_code"`   // 电子证照目录编码
	Name                 string             `json:"name"`       // 电子证照目录名称，可能存在高亮标签
	RawName              string             `json:"raw_name"`   // 电子证照目录名称，不会存在高亮标签
	UpdatedAt            int64              `json:"updated_at"` // 更新时间
	OnlineAt             int64              `json:"online_at"`  // 上线时间
	IsOnline             bool               `json:"is_online"`
	OnlineStatus         string             `json:"online_status"`                              // 上线状态
	Fields               []*es_common.Field `json:"fields"`                                     // 字段列表，有匹配字段的排在前面
	LicenseType          string             `json:"license_type" binding:"omitempty"`           // 证件类型:证照
	CertificationLevel   string             `json:"certification_level" binding:"omitempty"`    // 发证级别
	HolderType           string             `json:"holder_type" binding:"omitempty"`            // 证照主体
	Expire               string             `json:"expire" binding:"omitempty"`                 // 有效期
	Department           string             `json:"department" binding:"omitempty"`             // 管理部门:xx市数据资源管理局
	IndustryDepartmentID string             `json:"industry_department_id" binding:"omitempty"` // 行业类别id
	IndustryDepartment   string             `json:"industry_department" binding:"omitempty"`    // 行业类别:市场监督
}

func NewSummaryInfo(item *es.SearchResultItem) *SummaryInfo {
	return &SummaryInfo{
		ID:           item.ID,
		Code:         item.Code,
		RawCode:      item.RawCode,
		Name:         item.Name,
		RawName:      item.RawName,
		OnlineAt:     item.OnlineAt.UnixMilli(),
		UpdatedAt:    item.UpdatedAt.UnixMilli(),
		OnlineStatus: item.OnlineStatus,
		IsOnline:     item.IsOnline,
		Fields: lo.Map(item.Fields, func(f *es_common.Field, _ int) *es_common.Field {
			return &es_common.Field{
				RawFieldNameZH: f.RawFieldNameZH,
				FieldNameZH:    f.FieldNameZH,
				RawFieldNameEN: f.RawFieldNameEN,
				FieldNameEN:    f.FieldNameEN,
			}
		}),
		LicenseType:          item.LicenseType,
		CertificationLevel:   item.CertificationLevel,
		HolderType:           item.HolderType,
		Expire:               item.Expire,
		Department:           item.Department,
		IndustryDepartmentID: item.IndustryDepartmentID,
		IndustryDepartment:   item.IndustryDepartment,
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
	DocId                string             `json:"docid,omitempty"`                               // doc id
	ID                   string             `json:"id"`                                            // 电子证照目录id
	Code                 string             `json:"code"`                                          // 电子证照目录编码
	Name                 string             `json:"name"`                                          // 电子证照目录名称
	UpdatedAt            int64              `json:"updated_at,omitempty" binding:"omitempty,gt=0"` // 电子证照目录更新时间
	OnlineAt             int64              `json:"online_at,omitempty" binding:"omitempty,gt=0"`  // 上线时间
	IsOnline             bool               `json:"is_online"`                                     // 是否上线
	OnlineStatus         string             `json:"online_status"`                                 // 上线状态
	Fields               []*es_common.Field `json:"fields" binding:"omitempty"`                    // 信息项列表
	LicenseType          string             `json:"license_type" binding:"omitempty"`              // 证件类型:证照
	CertificationLevel   string             `json:"certification_level" binding:"omitempty"`       // 发证级别
	HolderType           string             `json:"holder_type" binding:"omitempty"`               // 证照主体
	Expire               string             `json:"expire" binding:"omitempty"`                    // 有效期
	Department           string             `json:"department" binding:"omitempty"`                // 管理部门:xx市数据资源管理局
	IndustryDepartmentID string             `json:"industry_department_id" binding:"omitempty"`    // 行业类别id
	IndustryDepartment   string             `json:"industry_department" binding:"omitempty"`       // 行业类别:市场监督

}

// 将时间字段的类型从time.Time 转成 毫秒时间戳类型
func (p *IndexToESReqParam) ToItem() *es.Item {
	ret := es.Item{
		BaseItem: es.BaseItem{
			ID:                   p.ID,
			Code:                 p.Code,
			Name:                 p.Name,
			UpdatedAt:            time.UnixMilli(p.UpdatedAt),
			Fields:               p.Fields,
			IsOnline:             p.IsOnline,
			OnlineAt:             time.UnixMilli(p.OnlineAt),
			OnlineStatus:         p.OnlineStatus,
			LicenseType:          p.LicenseType,
			CertificationLevel:   p.CertificationLevel,
			HolderType:           p.HolderType,
			Expire:               p.Expire,
			Department:           p.Department,
			IndustryDepartmentID: p.IndustryDepartmentID,
			IndustryDepartment:   p.IndustryDepartment,
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
