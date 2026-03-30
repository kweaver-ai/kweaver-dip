package my_favorite

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	r_my_favorite "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
)

type UseCase interface {
	Create(ctx context.Context, req *CreateReq) (*response.IDResp, error)
	Delete(ctx context.Context, favorID uint64) (*response.IDResp, error)
	GetList(ctx context.Context, req *ListReq) (*ListResp, error)
	CheckIsFavoredV1(ctx context.Context, req *CheckV1Req) (*CheckV1Resp, error)
	CheckIsFavoredV2(ctx context.Context, req *CheckV2Req) ([]*CheckV2Resp, error)
}

const (
	S_RES_TYPE_DATA_CATALOG  = "data-catalog"         // 数据资源目录
	S_RES_TYPE_INFO_CATALOG  = "info-catalog"         // 信息资源目录
	S_RES_TYPE_ELEC_CATALOG  = "elec-licence-catalog" // 电子证照目录
	S_RES_TYPE_DATA_VIEW     = "data-view"            // 数据视图
	S_RES_TYPE_INTERFACE_SVC = "interface-svc"        // 接口服务
	S_RES_TYPE_INDICATOR     = "indicator"            // 指标
)

func ResType2Enum(resType string) r_my_favorite.ResType {
	rt := r_my_favorite.ResType(0)
	switch resType {
	case S_RES_TYPE_DATA_CATALOG:
		rt = r_my_favorite.RES_TYPE_DATA_CATALOG
	case S_RES_TYPE_INFO_CATALOG:
		rt = r_my_favorite.RES_TYPE_INFO_CATALOG
	case S_RES_TYPE_ELEC_CATALOG:
		rt = r_my_favorite.RES_TYPE_ELEC_CATALOG
	case S_RES_TYPE_DATA_VIEW:
		rt = r_my_favorite.RES_TYPE_DATA_VIEW
	case S_RES_TYPE_INTERFACE_SVC:
		rt = r_my_favorite.RES_TYPE_INTERFACE_SVC
	case S_RES_TYPE_INDICATOR:
		rt = r_my_favorite.RES_TYPE_INDICATOR
	}
	return rt
}

type CreateReq struct {
	ResType string `json:"res_type" binding:"TrimSpace,required,oneof=data-catalog info-catalog elec-licence-catalog data-view interface-svc indicator" example:"data-catalog"` // 收藏资源类型 data-catalog 数据资源目录 info-catalog 信息资源目录 elec-licence-catalog 电子证照目录
	ResID   string `json:"res_id" binding:"TrimSpace,required,min=1,max=64" example:"544217704094017271"`                                                                       // 收藏资源ID
}

type FavorIDPathReq struct {
	FavorID models.ModelID `uri:"favor_id" binding:"TrimSpace,required,VerifyModelID"` // 收藏项ID
}

type ListReq struct {
	Offset        int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`                                                                                   // 页码，默认1
	Limit         int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"`                                                                       // 每页大小，默认10
	Keyword       string `form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128" example:"keyword"`                                                                                // 关键字查询，模糊匹配资源名称及编码
	ResType       string `form:"res_type" binding:"TrimSpace,omitempty,oneof=data-catalog info-catalog elec-licence-catalog data-view interface-svc indicator" example:"data-catalog"` // 收藏资源类型 data-catalog 数据资源目录 info-catalog 信息资源目录 elec-licence-catalog 电子证照目录
	Direction     string `json:"direction" form:"direction,default=desc" default:"desc"`                                                                                               // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort          string `json:"sort" form:"sort,default=created_at" default:"res_name"`                                                                                               // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	DepartmentId  string `form:"department_id" binding:"TrimSpace,omitempty,min=1,max=64" example:"544217704094017271"`
	IndicatorType string `form:"indicator_type" json:"indicator_type" binding:"TrimSpace,omitempty" example:"data-catalog"`
}

func ListReqParam2Map(req *ListReq) map[string]any {
	rMap := map[string]any{
		"offset": req.Offset,
		"limit":  req.Limit,
	}

	if req.Offset <= 1 {
		rMap["offset"] = 1
	}

	if req.Limit <= 10 {
		rMap["limit"] = 10
	} else if req.Limit >= 1000 {
		rMap["limit"] = 1000
	}

	if len(req.Keyword) > 0 {
		rMap["keyword"] = req.Keyword
	}

	return rMap
}

type CheckV1Req struct {
	ResType string `form:"res_type" json:"res_type" binding:"TrimSpace,required,oneof=data-catalog info-catalog elec-licence-catalog data-view interface-svc indicator" example:"data-catalog"` // 收藏资源类型 data-catalog 数据资源目录 info-catalog 信息资源目录 elec-licence-catalog 电子证照目录
	ResID   string `form:"res_id" json:"res_id" binding:"TrimSpace,required,min=1,max=64" example:"544217704094017271"`                                                                         // 收藏资源ID
	// created_by string
	CreatedBy string `form:"created_by" json:"created_by"` // 创建人
}

type Subject struct {
	ID   string `json:"id"`   // 所属主题ID
	Name string `json:"name"` // 所属主题名称
	Path string `json:"path"` // 所属主题路径
}

type ListItem struct {
	*r_my_favorite.FavorBase
	ResType       *string    `json:"res_type,omitempty"`     // 资源/证照类型，信息资源目录不返回该字段\n资源类型：data_view 逻辑视图 interface_svc 接口服务\n证照类型：1 证明文件 2 批文批复 3 鉴定报告 4 其他文件
	Subjects      []*Subject `json:"subjects,omitempty"`     // 所属主题数组，电子证照目录类型不返回该字段
	OrgCode       string     `json:"org_code"`               // 所属/管理部门code
	OrgName       string     `json:"org_name"`               // 所属/管理部门名称
	OrgPath       string     `json:"org_path"`               // 所属/管理部门路径
	Score         *string    `json:"score,omitempty"`        // 综合评分，保留小数点后一位，仅数据资源目录返回该字段
	CreatedAt     int64      `json:"created_at"`             // 创建/收藏时间戳
	OnlineStatus  bool       `json:"is_online"`              // 上线状态
	OnlineAt      *int64     `json:"online_at,omitempty"`    // 上线时间戳，若未上线则不返回改字段
	PublishedAt   int64      `json:"published_at,omitempty"` // 发布时间戳，若未发布则不返回该字段
	PublishStatus bool       `json:"is_publish"`             // 发布状态
}

type ListResp struct {
	response.PageResult[ListItem]
}

type CheckV1Resp struct {
	IsFavored bool   `json:"is_favored"`                // 是否已收藏
	FavorID   uint64 `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
}

type Resources struct {
	ResType string   `json:"res_type" binding:"TrimSpace,required,oneof=data-catalog info-catalog elec-licence-catalog" example:"data-catalog"` // 收藏资源类型 data-catalog 数据资源目录 info-catalog 信息资源目录 elec-licence-catalog 电子证照目录
	ResIDs  []string `json:"res_ids" binding:"TrimSpace,required,min=1,unique" example:"544217704094017271"`                                    // 资源ID列表
}

type CheckV2Req struct {
	Resources []*Resources `json:"resources" binding:"required,min=1,dive,unique=ResType" ` // 待检查是否已收藏资源列表
}

type ResFavorCheckRet struct {
	ResID     string `json:"res_id" binding:"TrimSpace,required,min=1,unique" example:"544217704094017271"` // 资源ID
	IsFavored bool   `json:"is_favored" example:"true"`                                                     // 是否已收藏
	FavorID   uint64 `json:"favor_id,string,omitempty" example:"544217704094017271"`                        // 收藏项ID，仅已收藏时返回该字段
}

type CheckV2Resp struct {
	ResType   string              `json:"res_type" binding:"TrimSpace,required,oneof=data-catalog info-catalog elec-licence-catalog" example:"data-catalog"` // 收藏资源类型 data-catalog 数据资源目录 info-catalog 信息资源目录 elec-licence-catalog 电子证照目录
	Resources []*ResFavorCheckRet `json:"resources"`                                                                                                         // 该类型资源是否收藏查询结果列表
}
