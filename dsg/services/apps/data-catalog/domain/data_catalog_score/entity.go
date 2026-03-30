package data_resource_catalog

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
)

type DataCatalogScoreDomain interface {
	CreateDataCatalogScore(ctx *gin.Context, catalogId uint64, score int8) (resp *IDResp, err error)
	UpdateDataCatalogScore(ctx *gin.Context, catalogId uint64, score int8) (resp *IDResp, err error)
	GetCatalogScoreList(ctx *gin.Context, req *PageInfo) (resp *ScoreListResp, err error)
	GetDataCatalogScoreDetail(ctx *gin.Context, catalogId uint64, req *ScoreDetailReq) (resp *ScoreDetailResp, err error)
	GetDataCatalogScoreSummary(ctx *gin.Context, catalogIds []models.ModelID) (resp []*ScoreSummaryInfo, err error)
}

type CatalogIDRequired struct {
	CatalogID models.ModelID `json:"catalog_id" form:"catalog_id" uri:"catalog_id" binding:"required,VerifyModelID" example:"1"` // 目录ID
}

type IDResp struct {
	ID string `json:"id"` // 资源对象ID
}

type CatalogScore struct {
	Score int8 `json:"score" binding:"required,min=1,max=5" example:"1"` // 数据资源目录评分
}

// region GetUserCatalogScoreList

type PageInfo struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc" example:"desc"`            // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=scored_at" binding:"omitempty,oneof=scored_at name" default:"scored_at" example:"scored_at"` // 排序类型，枚举：scored_at：按评分时间排序；name：按目录名称排序。默认按评分时间排序
}

type ScoreListResp struct {
	Entries    []*DataCatalogScoreInfo `json:"entries" binding:"required"`     // 对象列表
	TotalCount int64                   `json:"total_count" binding:"required"` // 当前筛选条件下的对象数量
}
type DataCatalogScoreInfo struct {
	ID             string `json:"id" binding:"required" example:"1"`                       // 评分记录id
	CatalogID      string `json:"catalog_id" binding:"required" example:"1"`               // 数据目录id
	Name           string `json:"name" binding:"required" example:"name"`                  // 目录名称
	Code           string `json:"code" binding:"required" example:"SJZYMU20241203/000001"` // 编码
	Department     string `json:"department" binding:"omitempty"`                          // 所属部门
	DepartmentPath string `json:"department_path" binding:"omitempty"`                     // 所属部门路径
	Score          string `json:"score" binding:"required" example:"1.0"`                  // 数据资源目录评分
	ScoredAt       int64  `json:"scored_at" binding:"required" `                           // 评分时间
}
type DataCatalogScoreVo struct {
	ID           uint64    `gorm:"column:id"`            // 评分记录id
	CatalogID    uint64    `gorm:"column:catalog_id"`    // 数据目录id
	Title        string    `gorm:"column:title"`         // 目录名称
	Code         string    `gorm:"column:code"`          // 编码
	DepartmentId string    `gorm:"column:department_id"` // 所属部门
	Score        int8      `gorm:"column:score"`         // 数据资源目录评分
	ScoredAt     time.Time `gorm:"column:scored_at"`     // 评分时间
}

//endregion

// region GetDataCatalogScoreDetail

type ScoreDetailReq struct {
	request.PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc" example:"desc"`       // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=scored_at" binding:"omitempty,oneof=scored_at" default:"scored_at" example:"scored_at"` // 排序类型，枚举：scored_at：按评分时间排序
}

type ScoreDetailResp struct {
	AverageScore string            `json:"average_score" binding:"required" example:"1.0"` // 数据资源目录平均分
	ScoreStat    []*ScoreCountInfo `json:"score_stat" binding:"required"`                  // 评分统计
	ScoreDetail  *ScoreDetail      `json:"score_detail" binding:"required"`                // 用户评分列表
}

type ScoreCountInfo struct {
	Score int8  `json:"score" binding:"required,min=1,max=5" example:"1"` // 数据资源目录评分
	Count int64 `json:"count" binding:"required" example:"1"`             // 评分数量
}

type ScoreDetail struct {
	Entries    []*UserScoreInfo `json:"entries" binding:"required"`                 // 对象列表
	TotalCount int64            `json:"total_count" binding:"required" example:"1"` // 评分总数量
}

type UserScoreInfo struct {
	CatalogID      string `json:"catalog_id" binding:"required" example:"1"`   // 数据目录id
	Department     string `json:"department" binding:"omitempty"`              // 所属部门
	DepartmentPath string `json:"department_path" binding:"omitempty"`         // 所属部门路径
	Score          string `json:"score" binding:"required" example:"1.0"`      // 数据资源目录评分
	UserName       string `json:"user_name" binding:"required" example:"name"` // 用户名
	ScoredAt       int64  `json:"scored_at" binding:"required" `               // 评分时间
}
type UserScoreVo struct {
	CatalogID    uint64    `gorm:"column:catalog_id"`    // 数据目录id
	Title        string    `gorm:"column:title"`         // 目录名称
	DepartmentId string    `gorm:"column:department_id"` // 所属部门
	Score        int8      `gorm:"column:score"`         // 数据资源目录评分
	ScoredUid    string    `gorm:"column:scored_uid"`    // 评分用户id
	ScoredAt     time.Time `gorm:"column:scored_at"`     // 评分时间
}

//endregion

// region GetDataCatalogScoreSummary

type CatalogIDsRequired struct {
	CatalogIDs []models.ModelID `json:"catalog_ids" form:"catalog_ids" uri:"catalog_ids" binding:"required"` // 目录ID列表
}

type ScoreSummaryInfo struct {
	CatalogID    string `json:"catalog_id" binding:"required" example:"1"`      // 数据目录id
	AverageScore string `json:"average_score" binding:"required" example:"1.0"` // 数据资源目录平均分
	Count        int64  `json:"count" binding:"required" example:"1"`           // 评分数量
	HasScored    bool   `json:"has_scored" binding:"required" example:"false"`  // 当前用户对目录是否存在打分记录
}

type ScoreSummaryVo struct {
	CatalogID    uint64  `gorm:"column:catalog_id"`    // 数据目录id
	AverageScore float32 `gorm:"column:average_score"` // 数据资源目录平均分
	Count        int64   `gorm:"column:count"`         // 评分数量
	HasScored    bool    `gorm:"column:has_scored"`    // 当前用户对目录是否存在打分记录
}

//endregion
