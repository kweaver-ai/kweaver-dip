package cognitive_service_system

import (
	"context"

	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
)

type CognitiveServiceSystemDomain interface {
	GetSingleCatalogInfo(ctx context.Context, req *GetSingleCatalogInfoReq) (*GetSingleCatalogInfoRes, error)
	SearchSingleCatalog(ctx context.Context, req *SearchSingleCatalogReq) (*SearchSingleCatalogRes, error)
	CreateSingleCatalogTemplate(ctx context.Context, req *CreateSingleCatalogTemplateReq) (*CreateSingleCatalogTemplateRes, error)
	GetSingleCatalogTemplateList(ctx context.Context, req *GetSingleCatalogTemplateListReq) (*GetSingleCatalogTemplateListRes, error)
	GetSingleCatalogTemplateDetails(ctx context.Context, req *GetSingleCatalogTemplateDetailsReq) (*GetSingleCatalogTemplateDetailsRes, error)
	UpdateSingleCatalogTemplate(ctx context.Context, req *UpdateSingleCatalogTemplateReq) (*UpdateSingleCatalogTemplateRes, error)
	DeleteSingleCatalogTemplate(ctx context.Context, req *DeleteSingleCatalogTemplateReq) (*DeleteSingleCatalogTemplateRes, error)
	GetSingleCatalogHistoryList(ctx context.Context, req *GetSingleCatalogHistoryListReq) (*GetSingleCatalogHistoryListRes, error)
	GetSingleCatalogHistoryDetails(ctx context.Context, req *GetSingleCatalogHistoryDetailsReq) (*GetSingleCatalogHistoryDetailsRes, error)
	GetSingleCatalogTemplateNameUnique(ctx context.Context, req *GetSingleCatalogTemplateNameUniqueReq) (*GetSingleCatalogTemplateNameUniqueRes, error)
}

type GetSingleCatalogInfoReq struct {
	Limit        string `json:"limit" form:"limit" binding:"required,TrimSpace,max=128"`                  // 数据推送模型名称
	DepartmentId string `json:"department_id" form:"department_id" binding:"TrimSpace,omitempty,max=300"` // 描述
	Type         string `json:"type" form:"type" binding:"required"`                                      // 责任人ID
	Keywords     string `json:"keywords" form:"keywords" binding:"TrimSpace,max=128"`
}

type GetSingleCatalogInfoRes struct {
	Entries    []*SingleCatalogInfoEntry `json:"entries" binding:"required,TrimSpace,max=128"`      // 数据推送模型名称
	TotalCount int                       `json:"total_count" binding:"TrimSpace,omitempty,max=300"` // 描述

}

type SingleCatalogInfoEntry struct {
	Type             string                    `json:"type" binding:"required,TrimSpace,max=128"` // 数据推送模型名称
	ID               string                    `json:"id" binding:"TrimSpace,omitempty,max=300"`  // 描述
	Name             string                    `json:"name" binding:"required"`                   // 责任人ID
	Expand           bool                      `json:"expand" binding:"required"`
	ResourceType     int                       `json:"resource_type" binding:"required"`
	ResourceId       string                    `json:"resource_id" binding:"required"`
	Children         []*SingleCatalogInfoEntry `json:"children" binding:"required"`
	DepartmentPath   string                    `json:"path" binding:"required"`
	DepartmentPathId string                    `json:"department_path_id" binding:"required"`
}

type SearchSingleCatalogReq struct {
	DataCatalogId    string   `json:"data_catalog_id" binding:"required,TrimSpace,max=128"`                                      // 数据推送模型名称
	Fields           []string `json:"fields" binding:"TrimSpace,omitempty,max=300"`                                              // 描述
	Direction        string   `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	SortFieldId      string   `json:"sort_field_id" form:"sort_field_id" binding:"omitempty,uuid"`
	Configs          string   `json:"configs" binding:"omitempty" default:""` // 配置
	FieldsDetails    string   `json:"fields_details" binding:"omitempty"`
	Limit            int      `json:"limit" binding:"required"`
	Offset           int      `json:"offset" binding:"required"`
	Type             string   `json:"type" binding:"required"`
	DepartmentPathId string   `json:"department_path_id" binding:"omitempty"`
	SearchType       string   `json:"search_type" binding:"required,oneof=submit auto"`
}

type SearchSingleCatalogRes struct {
	data_view.DataPreviewResp
}

type CreateSingleCatalogTemplateReq struct {
	CreateSingleCatalogTemplateBody `param_type:"body"`
}

type CreateSingleCatalogTemplateBody struct {
	DataCatalogId    string   `json:"data_catalog_id"`
	Name             string   `json:"name"`        // 模板名称
	Description      string   `json:"description"` // 模板描述
	Configs          string   `json:"configs"`
	Fields           []string `json:"fields"`
	FieldsDetails    string   `json:"fields_details" binding:"omitempty"`
	Type             string   `json:"type" binding:"required"`
	DepartmentPathId string   `json:"department_path_id" binding:"omitempty"`
}

type CreateSingleCatalogTemplateRes struct {
	Status string `json:"status"` // 更新时间
}

type GetSingleCatalogTemplateListReq struct {
	GetSingleCatalogTemplateListReqParamPath `param_type:"query"`
}

type GetSingleCatalogTemplateListReqParamPath struct {
	Offset    *int   `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`           // 页码，默认1
	Limit     *int   `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"` // 每页大小，默认10
	Direction string `json:"direction" form:"direction" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Sort      string `json:"sort" form:"sort" binding:"omitempty,oneof=updated_at name" `
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetSingleCatalogTemplateListRes struct {
	Entries    []*SingleCatalogTemplate `json:"entries"`
	TotalCount int64                    `json:"total_count" binding:"required,gte=0" example:"3"`
}

type SingleCatalogTemplate struct {
	ID              string `json:"id"`                // id
	Name            string `json:"name"`              // 模板名称
	Description     string `json:"description"`       // 描述信息
	DataCatalogId   string `json:"data_catalog_id"`   // 数据目录id
	DataCatalogName string `json:"data_catalog_name"` // 数据目录名称
	UpdatedAt       int64  `json:"updated_at"`        // 更新时间
	ErrorType       int    `json:"error_type"`
}

type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetSingleCatalogTemplateDetailsReq struct {
	IDReqParamPath `param_type:"path"`
}

type GetSingleCatalogTemplateDetailsRes struct {
	ID               string   `json:"id"`                // 数据源业务id
	Name             string   `json:"name"`              // 数据源业务id
	Description      string   `json:"description"`       // 数据源业务id
	DataCatalogId    string   `json:"data_catalog_id"`   // 数据源业务id
	DataCatalogName  string   `json:"data_catalog_name"` // 信息系统id
	ResourceType     int      `json:"resource_type"`
	ResourceId       string   `json:"resource_id"`
	Fields           []string `json:"fields"`
	FieldsDetails    string   `json:"fields_details" binding:"omitempty"`
	Configs          string   `json:"configs"`
	Type             string   `json:"type"`
	DepartmentPathId string   `json:"department_path_id"`
	CreatedAt        int64    `json:"created_at"`      // 创建时间
	CreatedByName    string   `json:"created_by_name"` // 创建人姓名
	UpdatedAt        int64    `json:"updated_at"`      // 更新时间
	UpdatedByName    string   `json:"updated_by_name"` // 创建人姓名
}

type UpdateSingleCatalogTemplateReq struct {
	IDReqParamPath                  `param_type:"path"`
	UpdateSingleCatalogTemplateBody `param_type:"body"`
}

type UpdateSingleCatalogTemplateBody struct {
	Name             string   `json:"name"`            // 数据源业务id
	DataCatalogId    string   `json:"data_catalog_id"` // 数据源业务id
	Description      string   `json:"description"`     // 数据源业务id
	Fields           []string `json:"fields"`
	FieldsDetails    string   `json:"fields_details" binding:"omitempty"`
	Configs          string   `json:"configs"`
	Type             string   `json:"type" binding:"required"`
	DepartmentPathId string   `json:"department_path_id" binding:"omitempty"`
}

type UpdateSingleCatalogTemplateRes struct {
	Status string `json:"status"` // 更新时间
}

type DeleteSingleCatalogTemplateReq struct {
	IDReqParamPath `param_type:"path"`
}

type DeleteSingleCatalogTemplateRes struct {
	Status string `json:"status"` // 更新时间
}

type GetSingleCatalogHistoryListReq struct {
	GetSingleCatalogHistoryListReqParamPath `param_type:"query"`
}

type GetSingleCatalogHistoryListReqParamPath struct {
	Offset    *int   `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`           // 页码，默认1
	Limit     *int   `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"` // 每页大小，默认10
	Direction string `json:"direction" form:"direction" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Sort      string `json:"sort" form:"sort" binding:"omitempty,oneof=search_at data_catalog_name"`
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetSingleCatalogHistoryListRes struct {
	Entries    []*SingleCatalogHistory `json:"entries"`
	TotalCount int64                   `json:"total_count" binding:"required,gte=0" example:"3"`
}

type SingleCatalogHistory struct {
	ID              string `json:"id"`                // 数据源业务id
	DataCatalogId   string `json:"data_catalog_id"`   // 数据源业务id
	DataCatalogName string `json:"data_catalog_name"` // 信息系统id
	SearchAt        int64  `json:"search_at"`         // 更新时间
	SearchCount     int32  `json:"search_count"`
	ErrorType       int    `json:"error_type"`
}

type GetSingleCatalogHistoryDetailsReq struct {
	IDReqParamPath `param_type:"path"`
}

type GetSingleCatalogHistoryDetailsRes struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	DataCatalogId    string   `json:"data_catalog_id"`
	DataCatalogName  string   `json:"data_catalog_name"`
	Fields           []string `json:"fields"`
	FieldsDetails    string   `json:"fields_details" binding:"omitempty"`
	Configs          string   `json:"configs"`
	Type             string   `json:"type" binding:"required"`
	ResourceType     int      `json:"resource_type"`
	ResourceId       string   `json:"resource_id"`
	DepartmentPathId string   `json:"department_path_id" binding:"required"`
	SearchAt         int64    `json:"search_at"`
}

type GetSingleCatalogTemplateNameUniqueReq struct {
	Name string `form:"name" binding:"TrimSpace,required,max=128"` // 数据分析需求名称
}

type GetSingleCatalogTemplateNameUniqueRes struct {
	IsRepeated bool `json:"is_repeated"` // 是否重复
}
