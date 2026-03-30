package data_set

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DataSetUseCase interface {
	Create(ctx context.Context, req *CreateDataSetReq) (*CreateDataSetResp, error)
	Update(ctx context.Context, req *UpdateDataSetReq) (*UpdateDataSetResp, error)
	Delete(ctx context.Context, req *DeleteDataSetReq) (*DeleteDataSetResp, error)
	PageList(ctx context.Context, req *PageListDataSetParam) (*PageListDataSetResp, error)
	GetFormViewByIdByDataSetId(ctx context.Context, req *ViewPageListDataSetParam) (*PageListFormViewDetailResp, error)
	GetByName(ctx context.Context, name string) (*GetByNameResp, error)
	GetByNameCount(ctx context.Context, name string, id string) (*int64, error)
	GetById(ctx context.Context, id string) (*GetByNameResp, error)
	CreateDataSetViewRelation(ctx context.Context, req *AddDataSetReq, userID string) (*CreateDataSetViewRelationResp, error)
	DeleteDataSetViewRelation(ctx context.Context, req *RemoveDataSetViewRelationReq) (*DeleteDataSetViewRelationResp, error)
	GetDataSetViewRelation(ctx context.Context, id string) (*DataSetViewTree, error)
}

type CreateDataSetReq struct {
	CreateDataSetParameter `param_type:"body"`
}

type CreateDataSetParameter struct {
	DataSetName string `json:"data_set_name" form:"data_set_name" binding:"required" example:"test"`
	Description string `json:"description" form:"description"`
}

type AddDataSetReq struct {
	AddDataSetParameter `param_type:"body"`
}

type AddDataSetParameter struct {
	FormViewIDs []string `json:"form_view_ids" form:"form_view_ids" binding:"required,min=1,dive,uuid" example:"[\"1e90d213-bed5-40ee-b897-b406b0374768\", \"2e90d213-bed5-40ee-b897-b406b0374769\"]"` // 视图id列表
	Id          string   `json:"id" form:"id" binding:"required" example:"2b36a229-1423-449c-b6b8-70f1ec98d286"`
}

type CreateDataSetResp struct {
	ID string `json:"id"`
}

type GetDataSetReq struct {
	UpdateDataSetReq `param_type:"path"` // 表单视图id
}

type UpdateDataSetParameter struct {
	DataSetName        string `json:"data_set_name" form:"data_set_name" binding:"required"`
	DataSetDescription string `json:"description" form:"description" binding:"omitempty,min=1,max=255"`
}
type UpdateDataSetReq struct {
	IDReqParamPath         `param_type:"path"` // 表单视图id
	UpdateDataSetParameter `param_type:"body"`
}

type IDReqParamPath struct {
	ID string `json:"id" uri:"id"  binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据集的id
}

type UpdateDataSetResp struct {
	ID string `json:"id"`
}

type DeleteDataSetReq struct {
	IDReqParamPath `param_type:"path"` // 数据集的id
}

type DeleteDataSetParameter struct {
	ID string `json:"id"`
}

type DeleteDataSetResp struct {
	ID string `json:"id"`
}

type PageListDataSetParam struct {
	PageListDataSetReq `param_type:"query"`
}

type PageListDataSetReq struct {
	Sort      string `json:"sort" form:"sort,default=updated_at" binding:"omitempty,oneof=updated_at data_set_name" default:"updated_at"` // 排序类型，枚举：updated_at：按更新时间排序
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                             // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Keyword   string `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=255"`
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`          // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000" default:"10"` // 每页大小，默认10
}

type ViewPageListDataSetParam struct {
	IDReqParamPath         `param_type:"path"`
	ViewPageListDataSetReq `param_type:"query"`
}

type ViewPageListDataSetReq struct {
	//Name   string `json:"name" form:"name" binding:"omitempty,min=1,max=255"`
	Sort       string `json:"sort" form:"sort,default=created_at" binding:"oneof=updated_at business_name"  default:"updated_at"` // 排序类型，枚举：updated_at：按更新时间排序
	Direction  string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                    // 排序方向，枚举：asc：正序；desc：正序。默认正序
	Subject    string `json:"subject" form:"subject" binding:"omitempty,min=1,max=255"`                                           //主题域id
	Department string `json:"department" form:"department" binding:"omitempty,min=1,max=255"`                                     // 部门id
	Keyword    string `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=255"`                          //视图名称或者编码
	UpdatedAt  string `json:"updated_at" form:"updated_at" binding:"omitempty,min=1,max=255"`                                     // 更新时间
	Offset     int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                               // 页码，默认1
	Limit      int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000" default:"10"`                      // 每页大小，默认10
}

type PageListByIdDataSetParam struct {
	PageListByIdDataSetReq `param_type:"query"`
}
type PageListByIdDataSetReq struct {
	Name string `json:"id" form:"id" binding:"request,min=1,max=38"` //数据集id
}
type PageListDataSetResp struct {
	Entries    []*model.DataSet `json:"entries"`
	TotalCount int64            `json:"total_count"`
}

type GetFormViewByIdByDataSetIdReq struct {
	IDReqParamPath     `param_type:"path"`
	PageListDataSetReq `param_type:"query"`
}

type FormViewDetailResp struct {
	ID                 string    `json:"id"`
	UniformCatalogCode string    `json:"uniform_catalog_code"`
	BusinessName       string    `json:"business_name"`
	TechnicalName      string    `json:"technical_name"`
	SubjectName        string    `json:"subject_name"`
	DepartmentName     string    `json:"department_name"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type PageListFormViewDetailResp struct {
	Entries    []*FormViewDetailResp `json:"entries"`
	TotalCount int64                 `json:"total_count"`
}

type UpdateDataSetWithFormViewReq struct {
	IDReqParamPath                     `param_type:"path"` // 数据集的id
	UpdateDataSetWithFormViewParameter `param_type:"body"`
}

type UpdateDataSetWithFormViewParameter struct {
	DataSetName        string `json:"data_set_name" form:"data_set_name" binding:"required"`
	DataSetDescription string `json:"data_set_description" form:"data_set_description" binding:"required"`
}

type UpdateDataSetWithFormViewResp struct {
	Name string `json:"data_set_name"`
}

type GetByNameResp struct {
	ID                 string    `json:"id"`
	DataSetName        string    `json:"dataSetName"`
	DataSetDescription string    `json:"dataSetDescription"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
	CreatedByUID       string    `json:"createdByUID"`
	UpdatedByUID       string    `json:"updatedByUID"`
}

type RemoveFormViewsFromDataSetReq struct {
	RemoveFormViewsFromDataSetParameter `param_type:"body"`
}

type RemoveFormViewsFromDataSetParameter struct {
	FormViewIDs []string `json:"form_view_ids" form:"form_view_ids" binding:"required,min=1,dive,uuid" example:"[\"1e90d213-bed5-40ee-b897-b406b0374768\", \"2e90d213-bed5-40ee-b897-b406b0374769\"]"` // 视图id列表
	DataSetName string   `json:"data_set_name" form:"data_set_name" binding:"required" example:"test"`
}

type RemoveFormViewsFromDataSetResp struct {
	ID string `json:"id"`
}

// 新增请求结构体
type CreateDataSetViewRelationReq struct {
	DataSetViewRelationResp `param_type:"body"`
}
type DataSetViewRelationResp struct {
	Id          string   `json:"id" form:"id" binding:"required"`                                       // 数据集名称
	FormViewIDs []string `json:"form_view_ids" form:"form_view_ids" binding:"required,min=1,dive,uuid"` // 数据视图的id列表
}

// 新增响应结构体
type CreateDataSetViewRelationResp struct {
	ID string `json:"id"`
}

// 删除请求结构体
type DeleteDataSetViewRelationReq struct {
	ID          string   `json:"id" form:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据集的id
	DataSetName string   `json:"data_set_name" form:"data_set_name" binding:"required"`
	FormViewIDs []string `json:"form_view_ids" form:"form_view_ids" binding:"required,min=1,dive,uuid" example:"[\"1e90d213-bed5-40ee-b897-b406b0374768\", \"2e90d213-bed5-40ee-b897-b406b0374769\"]"` // 数据视图的id列表
}

type RemoveDataSetViewRelationReq struct {
	DataSetViewRelationResp `param_type:"body"`
}

// 新增响应结构体
type DeleteDataSetViewRelationResp struct {
	ID string `json:"id"`
}

type DataSetNameReq struct {
	NameReqParamPath `param_type:"path"`
}

type DataSetExistsNameReq struct {
	DataSetValidateNameReq `param_type:"query"`
}

type DataSetValidateNameReq struct {
	Id   string `json:"id" form:"id" binding:"omitempty"`
	Name string `json:"name" form:"name" binding:"omitempty"`
}

// CreateDataSetByNameReq 定义请求结构
type NameReqParamPath struct {
	Name string `json:"-" uri:"name" `
}

// CreateDataSetByNameResp 定义响应结构
type CreateDataSetByNameResp struct {
	Exists bool `json:"exists"`
}

type DataSetViewTree struct {
	DataSetName string       `json:"data_set_name"`
	Views       []ViewDetail `json:"views"`
}

type ViewDetail struct {
	BusinessName       string    `json:"business_name"`
	TechnicalName      string    `json:"technical_name"`
	UpdatedAt          time.Time `json:"updated_at"`
	ID                 string    `json:"id"`
	UniformCatalogCode string    `json:"uniform_catalog_code"`
}
