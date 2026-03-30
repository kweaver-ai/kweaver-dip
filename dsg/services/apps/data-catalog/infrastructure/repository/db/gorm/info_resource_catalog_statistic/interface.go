package info_resource_catalog_statistic

import (
	"context"

	"gorm.io/gorm"
)

type Repo interface {
	GetCatalogStatistics(tx *gorm.DB, ctx context.Context) (*CatalogStatistics, error)
	GetUncatalogedBusiFormNum(tx *gorm.DB, ctx context.Context) (int, error)
	GetCatalogedBusiFormNum(tx *gorm.DB, ctx context.Context) (*CatalogedBusiFormInfo, error)
	GetBusinessFormStatistics(tx *gorm.DB, ctx context.Context) ([]*BusinessFormStatistics, error)
	GetDeptCatalogStatistics(tx *gorm.DB, ctx context.Context) ([]*DeptCatalogStatistics, error)
	GetShareStatistics(tx *gorm.DB, ctx context.Context) (*ShareStatistics, error)
}

type CatalogStatistics struct {
	TotalNum           int `gorm:"column:total_num" json:"total_num"`                       // 目录总数
	UnpublishNum       int `gorm:"column:unpublish_num" json:"unpublish_num"`               // 未发布目录数
	PublishNum         int `gorm:"column:publish_num" json:"publish_num"`                   // 已发布目录数
	NotonlineNum       int `gorm:"column:notonline_num" json:"notonline_num"`               // 未上线目录数
	OnlineNum          int `gorm:"column:online_num" json:"online_num"`                     // 已上线目录数
	OfflineNum         int `gorm:"column:offline_num" json:"offline_num"`                   // 已下线目录数
	PublishAuditingNum int `gorm:"column:publish_auditing_num" json:"publish_auditing_num"` // 发布审核中目录数
	PublishPassNum     int `gorm:"column:publish_pass_num" json:"publish_pass_num"`         // 发布审核通过目录数
	PublishRejectNum   int `gorm:"column:publish_reject_num" json:"publish_reject_num"`     // 发布审核驳回目录数
	OnlineAuditingNum  int `gorm:"column:online_auditing_num" json:"online_auditing_num"`   // 发布审核中目录数
	OnlinePassNum      int `gorm:"column:online_pass_num" json:"online_pass_num"`           // 发布审核通过目录数
	OnlineRejectNum    int `gorm:"column:online_reject_num" json:"online_reject_num"`       // 发布审核驳回目录数
	OfflineAuditingNum int `gorm:"column:offline_auditing_num" json:"offline_auditing_num"` // 发布审核中目录数
	OfflinePassNum     int `gorm:"column:offline_pass_num" json:"offline_pass_num"`         // 发布审核通过目录数
	OfflineRejectNum   int `gorm:"column:offline_reject_num" json:"offline_reject_num"`     // 发布审核驳回目录数
}

type CatalogedBusiFormInfo struct {
	CatalogedNum int `gorm:"column:cataloged_num" json:"cataloged_num"` // 已编目业务表数
	PublishNum   int `gorm:"column:publish_num" json:"publish_num"`     // 已发布目录数
}

type BusinessFormStatistics struct {
	DepartmentID string `gorm:"column:department_id" json:"department_id"` // 部门ID
	TotalNum     int    `gorm:"column:total_num" json:"total_num"`         // 部门（已发布）业务表总数
	PublishNum   int    `gorm:"column:publish_num" json:"publish_num"`     // 部门已发布目录数
	Rate         string `gorm:"rate" json:"rate"`                          // 部门编目完成率
}

type DeptCatalogStatistics struct {
	DepartmentID string `gorm:"column:department_id" json:"department_id"` // 部门ID
	TotalNum     int    `gorm:"column:total_num" json:"total_num"`         // 部门目录总数
	PublishNum   int    `gorm:"column:publish_num" json:"publish_num"`     // 部门已发布目录数
	Rate         string `gorm:"rate" json:"rate"`                          // 部门目录提供占比
}

type ShareStatistics struct {
	NoneNum    int `gorm:"column:none_num" json:"none_num"`       // 不予共享目录数
	AllNum     int `gorm:"column:all_num" json:"all_num"`         // 无条件共享目录数
	PartialNum int `gorm:"column:partial_num" json:"partial_num"` // 有条件共享目录数
}
