package department_explore_report

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DepartmentExploreReportRepo interface {
	Update(ctx context.Context, reports []*model.DepartmentExploreReport) error
	GetList(ctx context.Context, limit, offset int, direction, sort string, departmentId string) (total int64, tasks []*model.DepartmentExploreReport, err error)
}
