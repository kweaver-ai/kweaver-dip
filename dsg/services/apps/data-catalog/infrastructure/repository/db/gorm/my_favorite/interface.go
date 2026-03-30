package my_favorite

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Create(tx *gorm.DB, ctx context.Context, m *model.TMyFavorite) error
	Delete(tx *gorm.DB, ctx context.Context, uid string, id uint64) (bool, error)
	GetList(tx *gorm.DB, ctx context.Context, resType ResType, uid string, params map[string]any) (int64, []*FavorDetail, error)
	CheckIsFavored(tx *gorm.DB, ctx context.Context, uid, resID string, resType ResType) (bool, error)
	FilterFavoredRIDSV1(tx *gorm.DB, ctx context.Context, uid string, resIDs []string, resType ResType) ([]*FavorIDBase, error)
	FilterFavoredRIDSV2(tx *gorm.DB, ctx context.Context, uid string, params []*FilterFavoredRIDSParams) ([]*FavorIDBase, error)
	// CountByResIDs 批量统计指定资源ID列表的收藏数量
	// resIDs: 资源ID列表（字符串格式）
	// resType: 资源类型
	// 返回: map[resID]count，key为资源ID，value为该资源的收藏数量
	CountByResIDs(tx *gorm.DB, ctx context.Context, resIDs []string, resType ResType) (map[string]int64, error)
}

type FilterFavoredRIDSParams struct {
	ResType
	ResIDs []string
}

// FavoriteCountResult 收藏数量统计结果
type FavoriteCountResult struct {
	ResID string `gorm:"column:res_id"` // 资源ID
	Count int64  `gorm:"column:count"`  // 收藏数量
}

type FavorIDBase struct {
	ID      uint64                            `gorm:"column:id;primaryKey" json:"id,string"` // 收藏项ID
	ResID   string                            `gorm:"column:res_id" json:"res_id"`           // 资源ID
	ResType `gorm:"column:res_type" json:"-"` // 资源类型
}

type FavorBase struct {
	FavorIDBase
	ResCode string `gorm:"column:res_code" json:"res_code"` // 资源CODE
	ResName string `gorm:"column:res_name" json:"res_name"` // 资源名称
}

type FavorDetail struct {
	*FavorBase
	CreatedAt time.Time `gorm:"column:created_at" json:"-"` // 创建/收藏时间
	OrgCode   string    `gorm:"column:org_code" json:"org_code"`
	OrgName   string    `gorm:"column:org_name" json:"org_name"`
	ResType   `gorm:"column:res_type" json:"res_type"`
}

type ResType int

const (
	RES_TYPE_DATA_CATALOG  ResType = iota + 1 // 数据资源目录
	RES_TYPE_INFO_CATALOG                     // 信息资源目录
	RES_TYPE_ELEC_CATALOG                     // 电子证照目录
	RES_TYPE_DATA_VIEW                        // 数据视图
	RES_TYPE_INTERFACE_SVC                    // 接口服务
	RES_TYPE_INDICATOR                        // 指标
)
