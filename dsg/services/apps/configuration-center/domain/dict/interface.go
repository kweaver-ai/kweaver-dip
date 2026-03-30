package dict

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
)

type UseCase interface {
	GetDictItemByType(ctx context.Context, dictTypes []string, queryType string) (*Dicts, error)

	QueryDictPage(ctx context.Context, req *QueryPageReqParam) (*QueryPageRespParam, error)

	GetDictById(ctx context.Context, id string) (*DictResp, error)

	GetDictDetail(ctx context.Context, id string) (*DictDetailResp, error)

	UpdateDictAndItem(ctx context.Context, req *DictUpdateResParam) (*AddRespParam, error)

	CreateDictAndItem(ctx context.Context, req *DictCreateResParam) (*AddRespParam, error)

	GetDictItemTypeList(ctx context.Context, queryType string) (*Dicts, error)

	QueryDictItemPage(ctx context.Context, req *QueryPageItemReqParam) (*QueryPageItemRespParam, error)

	GetDictList(ctx context.Context, queryType string) ([]*DictResp, error)

	BatchCheckNotExistTypeKey(ctx context.Context, req *DictTypeKeyReq) ([]string, error)
	DeleteDictAndItem(ctx context.Context, req *DictIdReq) (*AddRespParam, error)
}

type DictTypeReq struct {
	DictType  string `form:"dict_type" binding:"required,VerifyXssString"`                           // 字典类型
	QueryType string `json:"query_type" form:"query_type" binding:"omitempty,max=1,lte=1,oneof=0 1"` //查询类型 空全部,1省市直达0产品
	// DictType string `form:"dict_type" binding:"omitempty,oneof=area scene scene-type one-thing range sensitive-level catalog-share-type catalog-open-type resource-share-type resource-open-type resource-type column-type serve-type use-scope update-cycle publish share-type data-region level-type open-type certification-type net-type data-processing data-backflow backflow-region field-type org-code division-code center-dept-code data-sensitive-class catalog-tag system-class"`
}

type DictIdReq struct {
	ID string `json:"id" uri:"id" binding:"required,ValidateSnowflakeID"`
}

type QueryTypeReq struct {
	QueryType string `json:"query_type" form:"query_type" binding:"omitempty,max=1,lte=1,oneof=0 1"` //查询类型 空全部,1省市直达0产品
}

type DictTypeKeyReq struct {
	DictTypeKey []*DictTypeKey `json:"dict_type_key" binding:"required,dive"`
}

type DictTypeKey struct {
	DictType string `json:"dict_type" form:"dict_type" binding:"required"`
	DictKey  string `json:"dict_key" form:"dict_key" binding:"required"`
}

type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                      // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=2000" default:"10"`             // 每页大小，默认10
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=id" binding:"omitempty,oneof=updated_at name id" default:"id"`     // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type QueryPageReqParam struct {
	PageInfo
	Name      string `json:"name" form:"name" binding:"omitempty,VerifyXssString,min=1,max=128"`     // 关键字查询，字符无限制
	QueryType string `json:"query_type" form:"query_type" binding:"omitempty,max=1,lte=1,oneof=0 1"` //查询类型 空全部,1省市直达0产品
}

type QueryPageItemReqParam struct {
	PageInfo
	Name   string `json:"name" form:"name" binding:"VerifyXssString,omitempty,max=128"`  // 关键字查询，字符无限制
	DictId string `json:"dict_id" form:"dict_id" binding:"required,ValidateSnowflakeID"` //字典ID
}

type DictUpdateResParam struct {
	DictRes    *DictUpdateRes `json:"dict_res"  binding:"required,dive"`
	DicItemRes []*DictItemRes `json:"dict_item_res" binding:"dive"`
}
type DictItemRes struct {
	DictKey     string `json:"dict_key" binding:"required,VerifyXssString,max=64"`      // 键（字典码）
	DictValue   string `json:"dict_value"  binding:"required,VerifyXssString,max=100"`  // 值（名称）
	Description string `json:"description" binding:"omitempty,VerifyXssString,max=512"` // 备注
	//Sort        int32  `json:"sort" binding:"omitempty,lte=999"`
}

type DictUpdateRes struct {
	ID           string `json:"id" binding:"required,ValidateSnowflakeID"`               //ID
	Name         string `json:"name" binding:"required,VerifyXssString,max=128"`         // 名称
	Type         string `json:"dict_type" binding:"required,VerifyXssString,max=100"`    // 字典类型
	FDescription string `json:"description" binding:"omitempty,VerifyXssString,max=512"` // 描述
	SszdFlag     int32  `json:"sszd_flag" binding:"omitempty,max=1,lte=1,oneof=0 1"`     // 是否省市直达1是0否
}

type DictCreateResParam struct {
	DictRes    *DictCreateRes `json:"dict_res"  binding:"required,dive"`
	DicItemRes []*DictItemRes `json:"dict_item_res" binding:"dive"`
}

type DictCreateRes struct {
	Name         string `json:"name" binding:"required,VerifyXssString,max=128"`           // 名称
	Type         string `json:"dict_type" binding:"required,VerifyXssString,max=100"`      // 字典类型
	FDescription string `json:"f_description" binding:"omitempty,VerifyXssString,max=512"` // 描述
	SszdFlag     int32  `json:"sszd_flag" binding:"omitempty,max=1,lte=1,oneof=0 1"`       // 是否省市直达1是0否
}

type Dicts struct {
	Dicts []*DictEntry `json:"dicts"` // 字典列表
}

type DictEntry struct {
	DictType     string          `json:"dict_type"` // 字典类型
	DictItemResp []*DictItemResp `json:"dict_item_resp"  binding:"required"`
}

type DictItemResp struct {
	ID          string `json:"id" copier:"ID"`
	DictKey     string `json:"dict_key"`    // 键（字典码）
	DictValue   string `json:"dict_value"`  // 值（名称）
	Description string `json:"description"` // 码值备注
	Sort        int32  `json:"sort"`        // 码值备注
}

type DictResp struct {
	ID          string `json:"id" copier:"ID"`
	Name        string `json:"name" copier:"Name"`
	Type        string `json:"dict_type" copier:"FType"`
	Description string `json:"description" copier:"FDescription"`
	Version     string `json:"version" copier:"version"`
	CreatedAt   int64  `json:"created_at" copier:"CreatedAt"`
	CreatorName string `json:"creator_name" copier:"CreatorName"`
	UpdatedAt   int64  `json:"updated_at" copier:"UpdatedAt"`
	UpdaterName string `json:"updater_name" copier:"UpdaterName"`
}

// 字典分页
type QueryPageRespParam struct {
	DictResp   []*DictResp `json:"entries" binding:"required"`
	TotalCount int64       `json:"total_count" binding:"required,ge=0" example:"3"`
}

type QueryPageItemRespParam struct {
	DictItemResp []*DictItemResp `json:"entries" binding:"required"`
	TotalCount   int64           `json:"total_count" binding:"required,ge=0" example:"3"`
}

// 字典详情
type DictDetailResp struct {
	DictResp     *DictResp       `json:"dict_resp" binding:"required"`
	DictItemResp []*DictItemResp `json:"dict_item_resp"  binding:"required"`
}
type AddRespParam struct {
	response.IDResp
}
