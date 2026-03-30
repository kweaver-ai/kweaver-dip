package data_research_report

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type DataResearchReportRepo interface {
	Create(ctx context.Context, plan *model.DataResearchReport) error
	Delete(ctx context.Context, id string) error
	GetById(ctx context.Context, id string) (*model.DataResearchReportObject, error)
	GetByWorkOrderId(ctx context.Context, id string) (*model.DataResearchReportObject, error)
	GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataResearchReport, error)
	List(ctx context.Context, params *data_research_report.ResearchReportQueryParam) (int64, []*model.DataResearchReportObject, error)
	Update(ctx context.Context, plan *model.DataResearchReport) error
	CheckNameRepeat(ctx context.Context, id, name string) (bool, error)
	GetChangeAudit(ctx context.Context, id string) (*model.DataResearchReportChangeAuditObject, error)
	CreateChangeAudit(ctx context.Context, changeAudit *model.DataResearchReportChangeAudit) error
	UpdateChangeAudit(ctx context.Context, changeAudit *model.DataResearchReportChangeAudit) error
	DeleteChangeAudit(ctx context.Context, id string) error
	UpdateRejectReason(ctx context.Context, reportID string, rejectReason string) error
	UpdateFields(ctx context.Context, reportID string, fields map[string]interface{}) error
}
