package elec_licence

import (
	"context"
	"mime/multipart"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_resource"
	"github.com/xuri/excelize/v2"
)

type ElecLicenceUseCase interface {
	Search(ctx context.Context, req *SearchReq) (*SearchRes, error)
	GetElecLicenceList(ctx context.Context, req *ElecLicenceListReq) (*ElecLicenceListRes, error)
	GetElecLicenceDetail(ctx context.Context, id string) (*GetElecLicenceDetailRes, error)
	GetElecLicenceColumnList(ctx context.Context, req GetElecLicenceColumnListReq) (*GetElecLicenceColumnListRes, error)
	GetClassifyTree(ctx context.Context) (*GetClassifyTreeRes, error)
	GetClassify(ctx context.Context, req *GetClassifyReq) (*GetClassifyRes, error)
	Import(ctx context.Context, file multipart.File) error
	Export(ctx context.Context, req *ExportReq) (*excelize.File, error)
	CreateAuditInstance(ctx context.Context, req *CreateAuditInstanceReq) error
	PushToEs(ctx context.Context) error
}

type ElecLicenceIDRequired struct {
	ElecLicenceID string `json:"elec_licence_id" form:"elec_licence_id" uri:"elec_licence_id" binding:"required,uuid" example:"a638f8bb-8dda-49c2-9552-937928506280"`
}

// region Search

type SearchReq struct {
	Keyword             string                 `json:"keyword,omitempty" binding:"TrimSpace,omitempty,min=1" example:"keyword"`
	Filter              Filter                 `json:"filter,omitempty"`
	NextFlag            data_resource.NextFlag `json:"next_flag,omitempty"`
	IndustryDepartments []string               `json:"industry_departments,omitempty"`
	IsOnline            *bool                  `json:"-"`
}
type Filter struct {
	common.Filter
}

type SearchRes struct {
	// 数据资源列表
	Entries []*SearchEntrity `json:"entries"`
	// 总数量
	TotalCount int64 `json:"total_count"`
	// 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}
type SearchEntrity struct {
	Columns            []string `json:"columns"` // 信息项对象列表
	ID                 string   `json:"id"`
	Name               string   `json:"name"`     // 电子证照目录名称，可能存在高亮标签
	RawName            string   `json:"raw_name"` // 电子证照目录名称，不会存在高亮标签
	Code               string   `json:"code"`
	Type               string   `json:"type"`                      //证照类型
	Department         string   `json:"department"`                //管理部门
	OnlineStatus       string   `json:"online_status"`             //上线状态
	OnlineTime         int64    `json:"online_time"`               //上线时间
	UpdatedAt          int64    `json:"updated_at"`                //更新时间
	IndustryDepartment string   `json:"industry_department"`       //行业类别
	CertificationLevel string   `json:"certification_level"`       //发证级别
	FavorID            uint64   `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored          bool     `json:"is_favored"`                // 是否已收藏
}

//endregion

//region GetElecLicenceList

type ElecLicenceListReq struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction      *string  `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                                                  // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort           *string  `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at"`                                              // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	OnlineStatus   []string `json:"online_status"  form:"online_status" binding:"omitempty,dive,oneof=notline online offline up-auditing down-auditing up-reject down-reject" example:"online"` //上线状态
	UpdatedAtStart int64    `json:"updated_at_start" form:"updated_at_start" binding:"omitempty,gt=0" example:"1"`                                                                              //编辑开始时间
	UpdatedAtEnd   int64    `json:"updated_at_end" form:"updated_at_end" binding:"omitempty,gt=0" example:"2"`
	ClassifyID     string   `json:"classify_id" form:"classify_id" binding:"omitempty,uuid"`
	ClassifyIDs    []string `json:"-"`
}
type ElecLicenceList struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Code               string `json:"code"`
	IndustryDepartment string `json:"industry_department"` //行业类别
	CertificationLevel string `json:"certification_level"` //发证级别
	Type               string `json:"type"`                //证照类型
	Department         string `json:"department"`          //管理部门
	OnlineStatus       string `json:"online_status"`       //上线状态
	UpdatedAt          int64  `json:"updated_at"`          //更新时间
}
type ElecLicenceListRes struct {
	Entries      []*ElecLicenceList `json:"entries"`        // 对象列表
	TotalCount   int64              `json:"total_count"`    // 当前筛选条件下的对象数量
	LastSyncTime int64              `json:"last_sync_time"` // 上次同步时间
}

//endregion

type GetElecLicenceDetailRes struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Code               string `json:"code"`
	IndustryDepartment string `json:"industry_department"`       //行业类别
	CertificationLevel string `json:"certification_level"`       //发证级别
	Type               string `json:"type"`                      //证照类型
	HolderType         string `json:"holder_type"`               //证照主体
	Department         string `json:"department"`                //管理部门
	Expire             string `json:"expire"`                    //有效期
	OnlineStatus       string `json:"online_status"`             //上线状态
	OnlineTime         int64  `json:"online_time"`               //上线时间
	UpdatedAt          int64  `json:"updated_at"`                //更新时间
	FavorID            uint64 `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored          bool   `json:"is_favored"`                // 是否已收藏
}

//region GetElecLicenceColumnList

type GetElecLicenceColumnListReq struct {
	request.PageBaseInfo
	request.KeywordInfo
	ElecLicenceID string `json:"-" `
	Direction     string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort          string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at"`
}

type ElecLicenceColum struct {
	BusinessName string `json:"business_name"` // 信息项业务名称
	DataType     string `json:"data_type" `    // 信息项类型
	DataLength   int32  `json:"data_length"`   // 数据长度

}
type GetElecLicenceColumnListRes struct {
	Entries    []*ElecLicenceColum `json:"entries"` // 信息项对象列表
	TotalCount int64               `json:"total_count"`
}

//endregion

// region GetClassifyTree

type GetClassifyTreeRes struct {
	ClassifyTree []*ClassifyTree `json:"classify_tree"`
}
type ClassifyTree struct {
	ID       string          `json:"id"`
	Name     string          `json:"name"`
	Children []*ClassifyTree `json:"children,omitempty"`
}

//endregion

// region GetClassify

type GetClassifyReq struct {
	Keyword string `json:"keyword,omitempty" form:"keyword" binding:"TrimSpace,omitempty,min=1" example:"keyword"`
}

type GetClassifyRes struct {
	Classify []*Classify `json:"classify"`
}
type Classify struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	PathId string `json:"path_id"`
	Path   string `json:"path"`
}

//endregion

// region Export

type ExportReq struct {
	IDs []string `json:"ids"`
}

//endregion

// region CreateAuditInstanceReq

type CreateAuditInstanceReq struct {
	ElecLicenceIDRequired
	AuditType string `uri:"audit_type" binding:"required,oneof=af-elec-licence-online af-elec-licence-offline"`
}

//endregion
