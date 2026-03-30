package res_feedback

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Create(tx *gorm.DB, ctx context.Context, m *model.TResFeedback) error
	Update(tx *gorm.DB, ctx context.Context, m *model.TResFeedback, status []int) (bool, error)
	GetByID(tx *gorm.DB, ctx context.Context, ids []uint64) ([]*model.TResFeedback, error)
	GetList(tx *gorm.DB, ctx context.Context, uid string, id uint64, params map[string]any, resType string) (int64, []*CatalogFeedbackDetail, error)
	GetCount(tx *gorm.DB, ctx context.Context, uid string) (*CountInfo, error)
	//OverviewCount(ctx context.Context) (res OverviewCount, err error)
	//FilterByTimeCount(ctx context.Context, req *data_resource_catalog.AuditLogCountReq) (res []*data_resource_catalog_domain.Count, err error)
}

type CatalogFeedbackDetail struct {
	ID            uint64     `gorm:"column:id;primaryKey" json:"id"`            // 主键，雪花id
	ResID         string     `gorm:"column:res_id" json:"res_id"`               // 资源ID
	CatalogCode   string     `gorm:"column:res_code" json:"res_code"`           // 目录CODE
	CatalogTitle  string     `gorm:"column:res_title" json:"res_title"`         // 目录名称
	OrgCode       string     `gorm:"column:org_code" json:"org_code"`           // 目录所属部门
	FeedbackType  string     `gorm:"column:feedback_type" json:"feedback_type"` // 反馈类型
	FeedbackDesc  string     `gorm:"column:feedback_desc" json:"feedback_desc"` // 反馈描述
	Status        int        `gorm:"column:status" json:"status"`               // 反馈状态 10 待处理 90 已回复
	CreatedAt     time.Time  `gorm:"column:created_at" json:"created_at"`       // 创建时间
	CreatedBy     string     `gorm:"column:created_by" json:"created_by"`       // 创建/反馈人ID
	RepliedAt     *time.Time `gorm:"column:replied_at" json:"replied_at"`       // 反馈回复时间
	Indicator     string     `gorm:"column:indicator" json:"indicator"`
	IndicatorType string     `gorm:"column:indicator_type" json:"indicator_type"` // 指标类型
	ResType       string     `gorm:"column:res_type" json:"res_type"`             // 资源类型
}

type CountInfo struct {
	TotalNum   int64 `gorm:"column:total_num" json:"total_num"`     // 目录反馈总数
	PendingNum int64 `gorm:"column:pending_num" json:"pending_num"` // 待回复数量
	RepliedNum int64 `gorm:"column:replied_num" json:"replied_num"` // 已回复数量
}

type OverviewCount struct {
	DirInfoError     int64 `json:"dir_info_error"`     // 目录信息错误
	DataQualityIssue int64 `json:"data_quality_issue"` // 数据质量问题
	ResourceMismatch int64 `json:"resource_mismatch"`  // 挂接资源和目录不一致
	InterfaceIssue   int64 `json:"interface_issue"`    // 接口问题
	Other            int64 `json:"other"`              // 其他
}
type FilterByTimeCountRes struct {
	AuditResourceType int    `json:"type"`
	Dive              string `json:"dive"`
	Count             int    `json:"count"`
}
