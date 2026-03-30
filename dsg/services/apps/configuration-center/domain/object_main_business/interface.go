package object_main_business

import (
	"context"
)

type UseCase interface {
	GetObjectMainBusinessList(ctx context.Context, objectId string, req *QueryPageReq) (resp *QueryPageResp, err error)
	AddObjectMainBusiness(ctx context.Context, objectId string, req []*AddObjectMainBusinessInfo, uid string) (resp *CountResp, err error)
	UpdateObjectMainBusiness(ctx context.Context, req []*UpdateObjectMainBusinessInfo, uid string) (resp *CountResp, err error)
	DeleteObjectMainBusiness(ctx context.Context, req *IdsReq, uid string) (resp *CountResp, err error)
}

type ObjectIdReq struct {
	ID string `json:"id" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象ID
}

type IdsReq struct {
	IDs []string `json:"ids" uri:"ids" binding:"required"` // 记录ID
}

type QueryPageReq struct {
	Offset int `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`         // 页码
	Limit  int `json:"limit" form:"limit,default=10" binding:"min=0,max=100" default:"10"` // 每页大小，为0时不分页
}

type MainBusiness struct {
	ID               string `json:"id" binding:"required" example:"545911190992222513"`                               // 唯一id
	ObjectId         string `json:"object_id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象ID
	Name             string `json:"name"`                                                                             // 主干业务名称
	AbbreviationName string `json:"abbreviation_name"`                                                                // 主干业务简称
}
type QueryPageResp struct {
	Entries    []*MainBusiness `json:"entries" binding:"required"`                      // 主干业务列表
	TotalCount int64           `json:"total_count" binding:"required,ge=0" example:"3"` // 当前筛选条件下的主干业务数量
}

type AddObjectMainBusinessReq struct {
	MainBusinessInfos []*AddObjectMainBusinessInfo `json:"main_business_infos" binding:"required"`
}
type AddObjectMainBusinessInfo struct {
	Name             string `json:"name" binding:"required"`              // 主干业务名称
	AbbreviationName string `json:"abbreviation_name" binding:"required"` // 主干业务简称
}

type CountResp struct {
	Count int64 `json:"count" binding:"required,ge=0" example:"3"` // 成功的数量
}

type UpdateObjectMainBusinessReq struct {
	MainBusinessInfos []*UpdateObjectMainBusinessInfo `json:"main_business_infos" binding:"required"`
}
type UpdateObjectMainBusinessInfo struct {
	Id               string `json:"id" binding:"required" example:"545911190992222513"` // 唯一id
	Name             string `json:"name" binding:"required"`                            // 主干业务名称
	AbbreviationName string `json:"abbreviation_name" binding:"required"`               // 主干业务简称
}
