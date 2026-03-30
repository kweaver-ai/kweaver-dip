package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/assessment"
	"gorm.io/gorm"
)

// 数据归集计划表结构
type DataAggregationPlan struct {
	DataAggregationPlanID uint64  `gorm:"column:data_aggregation_plan_id;primaryKey"`
	ID                    string  `gorm:"column:id"`
	Name                  string  `gorm:"column:name"`
	ResponsibleUID        string  `gorm:"column:responsible_uid"`
	Priority              string  `gorm:"column:priority"`
	StartedAt             uint64  `gorm:"column:started_at"`
	FinishedAt            *uint64 `gorm:"column:finished_at"`
	AutoStart             uint8   `gorm:"column:auto_start"`
	Content               string  `gorm:"column:content"`
	Opinion               string  `gorm:"column:opinion"`
	AuditStatus           *uint8  `gorm:"column:audit_status"`
	AuditID               *uint64 `gorm:"column:audit_id"`
	AuditProcInstID       *string `gorm:"column:audit_proc_inst_id"`
	AuditResult           *string `gorm:"column:audit_result"`
	RejectReason          *string `gorm:"column:reject_reason"`
	CancelReason          *string `gorm:"column:cancel_reason"`
	Status                *uint8  `gorm:"column:status"`
	CreatedAt             string  `gorm:"column:created_at"`
	CreatedByUID          string  `gorm:"column:created_by_uid"`
	UpdatedAt             string  `gorm:"column:updated_at"`
	UpdatedByUID          string  `gorm:"column:updated_by_uid"`
	DeletedAt             uint64  `gorm:"column:deleted_at;default:0"`
}

func (DataAggregationPlan) TableName() string {
	return "af_tasks.data_aggregation_plan"
}

// 根据ID列表批量获取数据归集计划信息
func (r *AssessmentRepoImpl) GetDataAggregationPlansByIDs(ctx context.Context, planIDs []string) (map[string]assessment.DataAggregationPlanInfo, error) {
	if len(planIDs) == 0 {
		return make(map[string]assessment.DataAggregationPlanInfo), nil
	}

	var plans []DataAggregationPlan
	if err := r.db.WithContext(ctx).
		Where("id IN ? AND deleted_at = 0", planIDs).
		Select("id, name").
		Find(&plans).Error; err != nil {
		return nil, fmt.Errorf("查询数据归集计划失败: %w", err)
	}

	result := make(map[string]assessment.DataAggregationPlanInfo)
	for _, plan := range plans {
		result[plan.ID] = assessment.DataAggregationPlanInfo{
			ID:   plan.ID,
			Name: plan.Name,
		}
	}

	return result, nil
}

// 根据ID获取单个数据归集计划信息
func (r *AssessmentRepoImpl) GetDataAggregationPlanByID(ctx context.Context, planID string) (*assessment.DataAggregationPlanInfo, error) {
	var plan DataAggregationPlan
	if err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at = 0", planID).
		Select("id, name").
		First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("查询数据归集计划失败: %w", err)
	}

	return &assessment.DataAggregationPlanInfo{
		ID:   plan.ID,
		Name: plan.Name,
	}, nil
}
