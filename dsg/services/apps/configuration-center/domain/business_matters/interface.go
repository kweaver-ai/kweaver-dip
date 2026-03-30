package business_matters

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type BusinessMattersUseCase interface {
	CreateBusinessMatters(ctx context.Context, req *CreateReqBody, userInfo *model.User) (*ID, error)
	UpdateBusinessMatters(ctx context.Context, req *UpdateReq, userInfo *model.User) (*ID, error)
	DeleteBusinessMatters(ctx context.Context, Id string) error
	GetBusinessMattersList(ctx context.Context, req *ListReqQuery) (*ListRes, error)
	NameRepeat(ctx context.Context, req *NameRepeatReq) error
	GetListByIds(ctx context.Context, ids string) ([]*BusinessMatterBriefList, error)
}

type ID struct {
	Id string `json:"id" uri:"id" binding:"required,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 业务事项Id
}

type IDs struct {
	Ids string `json:"ids" uri:"ids" binding:"required" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159,f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 业务事项Ids(批量)
}

// region  CreateBusinessMatters
type CreateReqBody struct {
	Name            string `json:"name" binding:"required,lte=128" example:"name"`      // 业务事项名称
	TypeKey         string `json:"type_key" binding:"omitempty,VerifyXssString,max=64"` // 业务事项类型key
	DepartmentId    string `json:"department_id"  binding:"omitempty,uuid"`             // 部门id
	MaterialsNumber uint64 `json:"materials_number"  binding:"omitempty"`               // 材料数
}

func (i *CreateReqBody) ToModel(info model.User) *model.BusinessMatter {
	model := new(model.BusinessMatter)
	copier.Copy(model, i)
	model.BusinessMattersID = util.NewUUID()
	model.CreatorUID = info.ID
	model.UpdaterUID = info.ID
	return model
}

//endregion

// region UpdateBusinessMatters
type UpdateReq struct {
	UpdateReqPath `param_type:"path"`
	UpdateReqBody `param_type:"body"`
}
type UpdateReqPath struct {
	ID
}
type UpdateReqBody struct {
	Name            string `json:"name" binding:"required,lte=128" example:"name"`     // 业务事项名称
	TypeKey         string `json:"type_key" binding:"required,VerifyXssString,max=64"` // 业务事项类型key
	DepartmentId    string `json:"department_id"  binding:"omitempty,uuid"`            // 部门id
	MaterialsNumber uint64 `json:"materials_number"  binding:"omitempty"`              // 材料数
}

func (i *UpdateReqBody) ToModel(info model.User) *model.BusinessMatter {
	model := new(model.BusinessMatter)
	copier.Copy(model, i)
	model.UpdaterUID = info.ID
	return model
}

//endregion

//region DeleteBusinessMatters

type DeleteReq struct {
	ID
}

//endregion

// region BusinessMattersList
type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                      // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=2000" default:"12"`             // 每页大小，默认12
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=name" binding:"omitempty,oneof=name" default:"name"`               // 排序类型，枚举：name：按name排序。默认按name排序
}
type ListReqQuery struct {
	PageInfo
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
	TypeKey string `json:"type_key" form:"type_key" binding:"omitempty"`                       // 业务事项类型key
}

type ListRes struct {
	response.PageResults[BusinessMatterList]
}
type BusinessMatterList struct {
	ID              string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
	Name            string `json:"name"  example:"name"`                              // 业务事项名称
	TypeKey         string `json:"type_key" binding:"omitempty"`                      // 业务事项类型key
	TypeValue       string `json:"type_value" binding:"omitempty"`                    // 业务事项类型值
	DepartmentId    string `json:"department_id" binding:"omitempty"`                 // 部门id
	DepartmentName  string `json:"department_name" binding:"omitempty"`               // 部门名称
	DepartmentPath  string `json:"department_path" binding:"omitempty"`               // 部门路径
	MaterialsNumber uint64 `json:"materials_number" binding:"omitempty" example:"1"`  // 材料数

}

// Status          string `json:"status" example:"local"`                            // 新建（local）、同步（third）
// CreatedAt       int64  `json:"created_at" example:"1684301771000"`                // 创建时间
// CreatedName     string `json:"creator_name" example:"创建人名称"`                      //创建人
// UpdatedAt       int64  `json:"updated_at" example:"1684301771000"`                // 更新时间
// UpdatedName     string `json:"updater_name" example:"更新人名称"`                      //更新人

//endregion

type NameRepeatReq struct {
	Id   string `json:"id" form:"id" binding:"omitempty,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 业务事项ID
	Name string `json:"name" form:"name" binding:"TrimSpace,required,min=1,max=128" example:"name"`           // 业务事项名称
}

type BusinessMatterBriefList struct {
	ID   string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
	Name string `json:"name"  example:"name"`                              // 业务事项名称
}
