package my

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
)

// AsPageInfo 注意这里排序是created_at
type AsPageInfo struct {
	request.PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc" example:"desc"`                      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at" default:"created_at" example:"created_at"` // 排序类型，枚举：created_at：按创建时间排序 updated_at：按更新时间排序
}

// AssetApplyListReqParam 数据目录-资产申请列表请求参数
type AssetApplyListReqParam struct {
	Keyword   string `form:"keyword" binding:"TrimSpace,omitempty,min=1" example:"keyword"` // 搜索关键词
	UIDs      string `form:"uids" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`           // 用户ID字符串，以逗号分隔
	State     string `form:"state" example:"1"`                                             // 申请状态:1 审核中 2 审核通过 3 审核驳回不通过，以逗号分隔
	StartTime int64  `form:"start_time" binding:"omitempty,min=1" example:"1682586655000"`  // 筛选的开始时间，时间戳
	EndTime   int64  `form:"end_time" binding:"omitempty,min=1" example:"1682586655000"`    // 筛选的结束时间，时间戳omitempty,gtefiled=StartTime

	AsPageInfo
}

// AssetApplyDetailReqParam 数据目录-资产申请详情请求参数
type AssetApplyDetailReqParam struct {
	ApplyId models.ModelID `uri:"applyID" binding:"required,VerifyModelID" example:"1"` // 目录ID
}

// AvPageInfo 注意这里排序是published_at不是created_at
type AvPageInfo struct {
	request.PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`           // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=published_at" binding:"omitempty,oneof=published_at" default:"published_at"` // 排序类型，枚举：published_at：按发布时间排序
}

/*
// AvailableAssetListReqParam 数据目录-我的可用资产列表请求参数
type AvailableAssetListReqParam struct {
	Keyword string `form:"keyword" binding:"TrimSpace,omitempty,min=1"` // 搜索关键词
	Orgcode string `form:"orgcode"`                                     // 单选，资产所属部门
	UIDs    string `form:"uids"`                                        // 用户ID字符串，以逗号分隔，不传就查当前登录用户的可用资产列表

	AvPageInfo
}

type AssetReqPathParam struct {
	AssetID models.ModelID `uri:"assetID" binding:"required,VerifyModelID"` // 目录ID
}
*/
