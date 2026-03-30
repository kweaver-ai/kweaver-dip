package recognition_algorithm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
)

// RecognitionAlgorithmUseCase 是识别算法用例接口
// 定义了识别算法相关的业务逻辑操作

type RecognitionAlgorithmUseCase interface {
	PageList(ctx context.Context, req *PageListRecognitionAlgorithmReq) (*PageListRecognitionAlgorithmResp, error)
	Create(ctx context.Context, req *CreateRecognitionAlgorithmReq) (*CreateRecognitionAlgorithmResp, error)
	Update(ctx context.Context, req *UpdateRecognitionAlgorithmReq) (*UpdateRecognitionAlgorithmResp, error)
	GetDetailById(ctx context.Context, req *GetDetailByIdReq) (*RecognitionAlgorithmDetailResp, error)
	Delete(ctx context.Context, req *DeleteRecognitionAlgorithmReq) (*DeleteRecognitionAlgorithmResp, error)
	GetWorkingAlgorithmIds(ctx context.Context, req *GetWorkingAlgorithmIdsReq) (*GetWorkingAlgorithmIdsResp, error)
	DeleteBatch(ctx context.Context, req *DeleteBatchRecognitionAlgorithmReq) (*DeleteBatchRecognitionAlgorithmResp, error)
	Start(ctx context.Context, req *StartRecognitionAlgorithmReq) (*StartRecognitionAlgorithmResp, error)
	Stop(ctx context.Context, req *StopRecognitionAlgorithmReq) (*StopRecognitionAlgorithmResp, error)
	Export(ctx context.Context, req *ExportRecognitionAlgorithmReq) (*ExportRecognitionAlgorithmResp, error)
	GetInnerType(ctx context.Context, req *GetInnerTypeReq) (*GetInnerTypeResp, error)
	DuplicateCheck(ctx context.Context, req *DuplicateCheckReq) (*DuplicateCheckResp, error)
	GetSubjectsByIds(ctx context.Context, req *GetSubjectsByIdsReq) (*GetSubjectsByIdsResp, error)
}

type RecognitionAlgorithm struct {
	ID          string `json:"id"`          // 识别算法ID
	Name        string `json:"name"`        // 名称
	Description string `json:"description"` // 描述
	Algorithm   string `json:"algorithm"`   // 算法
	Type        string `json:"type"`        // 类型
	Status      int32  `json:"status"`      // 启用状态
	CreatedAt   int64  `json:"created_at"`  // 创建时间
	UpdatedAt   int64  `json:"updated_at"`  // 更新时间
}

// IDReqParamPath 用于获取请求路径中的id参数

type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

//#region PageList
// PageListRecognitionAlgorithmReq 分页查询识别算法的请求参数
// 此处可以根据实际需要增加更多查询字段

type PageListRecognitionAlgorithmReq struct {
	PageListRecognitionAlgorithmReqQueryParam `param_type:"query"`
}

type PageListRecognitionAlgorithmReqQueryParam struct {
	Status      string `json:"status" form:"status" binding:"omitempty"`             // 状态
	TrimDefault bool   `json:"trim_default" form:"trim_default" binding:"omitempty"` // 过滤掉内置默认模板 true是 false否
	request.PageSortKeyword3
}
type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type PageListRecognitionAlgorithmResp struct {
	PageResultNew[RecognitionAlgorithm]
}

//#endregion

//#region Create
// CreateRecognitionAlgorithmReq 创建识别算法的请求参数

type CreateRecognitionAlgorithmReq struct {
	CreateRecognitionAlgorithmReqBody `param_type:"body"`
}

type CreateRecognitionAlgorithmReqBody struct {
	Name        string `json:"name" form:"name" binding:"required" example:"Algorithm A"`                // 名称
	Description string `json:"description" form:"description" binding:"omitempty" example:"识别算法描述"`      // 识别算法描述
	Type        string `json:"type" form:"type" binding:"required,oneof=custom inner" example:"custom"`  // 算法类型，自定义;内置
	InnerType   string `json:"inner_type" form:"inner_type" binding:"omitempty"`                         // 内置类型
	Algorithm   string `json:"algorithm" form:"algorithm" binding:"required" example:"a + b"`            // 算法表达式
	Status      int32  `json:"status" form:"status" binding:"omitempty,oneof=1" default:"1" example:"1"` // 0停用1启用
}

type CreateRecognitionAlgorithmResp struct {
	ID string `json:"id"` // 识别算法ID
}

//#endregion

//#region Update
// UpdateRecognitionAlgorithmReq 更新识别算法的请求参数

type UpdateRecognitionAlgorithmReq struct {
	IDReqParamPath                    `param_type:"path"`
	UpdateRecognitionAlgorithmReqBody `param_type:"body"`
}

type UpdateRecognitionAlgorithmReqBody struct {
	Name        string `json:"name" form:"name" binding:"omitempty"`                                     // 识别算法名称
	Description string `json:"description" form:"description" binding:"omitempty"`                       // 描述
	Type        string `json:"type" form:"type" binding:"required,oneof=custom inner" example:"custom"`  // 算法类型，自定义;内置
	InnerType   string `json:"inner_type" form:"inner_type" binding:"omitempty"`                         // 内置类型
	Algorithm   string `json:"algorithm" form:"algorithm" binding:"omitempty"`                           // 算法表达式
	Status      int32  `json:"status" form:"status" binding:"omitempty,oneof=1" default:"1" example:"1"` // 0停用1启用
}

type UpdateRecognitionAlgorithmResp struct {
	ID string `json:"id"` // 识别算法ID
}

//#endregion

//#region GetDetailById
// GetDetailByIdReq 根据ID获取识别算法详情的请求参数

type GetDetailByIdReq struct {
	IDReqParamPath `param_type:"path"`
}

// RecognitionAlgorithmDetailResp 识别算法详情响应结构

type RecognitionAlgorithmDetailResp struct {
	ID            string `json:"id" binding:"uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 识别算法ID
	Name          string `json:"name" example:"Algorithm A"`                                       // 识别算法名称
	Description   string `json:"description" example:"识别算法描述"`                                     // 描述
	Algorithm     string `json:"algorithm" example:"a + b"`                                        // 算法表达式
	Type          string `json:"type" example:"custom"`                                            // 类型
	InnerType     string `json:"inner_type" example:"custom"`                                      // 内置类型
	Status        int    `json:"status" binding:"oneof=0 1" example:"1"`                           // 0停用1启用
	CreatedAt     string `json:"created_at" example:"2023-10-05T15:04:05Z"`                        // 创建时间
	CreatedByName string `json:"created_by_name" example:"admin"`                                  // 创建者
	UpdatedAt     string `json:"updated_at" example:"2023-10-05T15:04:05Z"`                        // 更新时间
	UpdatedByName string `json:"updated_by_name" example:"admin"`                                  // 更新者
}

//#endregion

//#region Delete
// DeleteRecognitionAlgorithmReq 删除识别算法的请求参数

type DeleteRecognitionAlgorithmReq struct {
	IDReqParamPath `param_type:"path"`
}

type DeleteRecognitionAlgorithmResp struct {
	ID string `json:"id"` // 删除的识别算法ID
}

//#endregion

//#region GetWorkingAlgorithmIds

type GetWorkingAlgorithmIdsReq struct {
	GetWorkingAlgorithmIdsReqBody `param_type:"body"`
}

type GetWorkingAlgorithmIdsReqBody struct {
	Ids []string `json:"ids" form:"ids" binding:"required"` // 识别算法ID列表
}

type GetWorkingAlgorithmIdsResp struct {
	WorkingIds []string `json:"working_ids" binding:"required"` // 生效的识别算法ID列表
}

//#endregion

//#region DeleteBatch

type DeleteBatchRecognitionAlgorithmReq struct {
	DeleteBatchRecognitionAlgorithmReqBody `param_type:"body"`
}

type DeleteBatchRecognitionAlgorithmReqBody struct {
	Ids  []string `json:"ids" form:"ids" binding:"required"`                    // 识别算法ID列表
	Mode string   `json:"mode" form:"mode" binding:"required,oneof=force safe"` // 删除模式，force: 强制删除，safe: 安全删除
}

type DeleteBatchRecognitionAlgorithmResp struct {
	DeletedIds []string `json:"deleted_ids" binding:"required"` // 删除的识别算法ID列表
}

//#endregion

//#region Start

type StartRecognitionAlgorithmReq struct {
	IDReqParamPath `param_type:"path"`
}

type StartRecognitionAlgorithmResp struct {
	ID string `json:"id"` // 启动的识别算法ID
}

//#endregion

//#region Stop

type StopRecognitionAlgorithmReq struct {
	IDReqParamPath `param_type:"path"`
}

type StopRecognitionAlgorithmResp struct {
	ID string `json:"id"` // 停止的识别算法ID
}

//#endregion

//#region Export

type ExportRecognitionAlgorithmReq struct {
	ExportRecognitionAlgorithmReqBody `param_type:"body"`
}

type ExportRecognitionAlgorithmReqBody struct {
	Ids []string `json:"ids" form:"ids" binding:"required"` // 识别算法ID列表
}

type ExportRecognitionAlgorithmResp struct {
	Data []RecognitionAlgorithm `json:"data" binding:"required"` // 识别算法数据
}

//#endregion

//#region GetInnerType

type GetInnerTypeReq struct {
	GetInnerTypeReqQueryParam `param_type:"query"`
}

type GetInnerTypeReqQueryParam struct {
	InnerType string `json:"inner_type" form:"inner_type" binding:"omitempty"` // 内置类型
}

type GetInnerTypeResp struct {
	InnerMap []InnerMap `json:"inner_map"` // 识别算法数据
}

type InnerMap struct {
	InnerType      string `json:"inner_type"`      // 内置类型
	InnerAlgorithm string `json:"inner_algorithm"` // 内置算法
}

//#endregion

//#region DuplicateCheck

type DuplicateCheckReq struct {
	DuplicateCheckReqBody `param_type:"body"`
}

type DuplicateCheckReqBody struct {
	Name string `json:"name" form:"name" binding:"required"` // 名称
	ID   string `json:"id" form:"id" binding:"omitempty"`    // 识别算法ID
}

type DuplicateCheckResp struct {
	IsDuplicate string `json:"is_duplicate"` // 是否存在
}

//#endregion

//#region GetSubjectsByIds

type GetSubjectsByIdsReq struct {
	GetSubjectsByIdsReqBody `param_type:"body"`
}

type GetSubjectsByIdsReqBody struct {
	Ids []string `json:"ids" form:"ids" binding:"required"` // 识别算法ID列表
}

type GetSubjectsByIdsResp struct {
	AlgorithmSubjects []AlgorithmSubject `json:"algorithm_subjects"` // 识别算法及其引用分类属性
}

type AlgorithmSubject struct {
	AlgorithmID   string    `json:"algorithm_id"`   // 识别算法id
	AlgorithmName string    `json:"algorithm_name"` // 识别算法名称
	Subjects      []Subject `json:"subjects"`       // 分类属性
}

type Subject struct {
	ID          string `json:"id"`          // 分类属性id
	Name        string `json:"name"`        // 分类属性名称
	Description string `json:"description"` // 分类属性描述
	PathId      string `json:"path_id"`     // 分类属性路径id
	PathName    string `json:"path_name"`   // 分类属性路径
}

//#endregion
