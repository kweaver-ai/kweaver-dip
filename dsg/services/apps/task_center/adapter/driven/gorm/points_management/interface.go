package points_management

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type PointsRuleConfigRepo interface {
	Create(ctx context.Context, pointRuleConfig *model.PointsRuleConfig) error
	Delete(ctx context.Context, code string) error
	Update(ctx context.Context, pointRuleConfig *model.PointsRuleConfig) error
	List(ctx context.Context) (int64, []*model.PointsRuleConfigObj, error)
	Detail(ctx context.Context, code string) (*model.PointsRuleConfigObj, error)
}

type PointsEventRepo interface {
	Create(ctx context.Context, pointEvent *model.PointsEvent) error
	PersionalPointsList(ctx context.Context, userID string, limit *int) (int64, []*model.PointsEvent, error)
	DepartmentPointsList(ctx context.Context, departmentID string, limit *int) (int64, []*model.PointsEvent, error)
	DepartmentTotalPoints(ctx context.Context, departmentID string) (int64, error)
	PersonalTotalPoints(ctx context.Context, userID string) (int64, error)
	DepartmentPointsTop(ctx context.Context, year string, top int) ([]DepartmentPointsRank, error)
	PointsEventGroupByCode(ctx context.Context, year string) ([]DepartmentPointsRank, error)
	PointsEventGroupByCodeAndMonth(ctx context.Context, year string) (map[string]interface{}, error)
	BatchCreateTopDepartment(ctx context.Context, topDepartments []*model.PointsEventTopDepartment) error
}

type DepartmentPointsRank struct {
	ID     string `gorm:"column:id"`
	Name   string `gorm:"column:name"`
	Points int64  `gorm:"column:points"`
}
