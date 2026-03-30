package audit_process_bind

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type AuditProcessBindRepo interface {
	Create(ctx context.Context, process *model.AuditProcessBind) (err error)
	List(ctx context.Context, req *audit_process_bind.ListReqQuery) (processes []*model.AuditProcessBind, count int64, err error)
	Get(ctx context.Context, bindId uint64) (process *model.AuditProcessBind, err error)
	GetByAuditType(ctx context.Context, AuditType string) (process *model.AuditProcessBind, err error)
	Update(ctx context.Context, bindId uint64, process *model.AuditProcessBind) (err error)
	Delete(ctx context.Context, bindId uint64) (err error)
	IsBindIdExist(ctx context.Context, bindId uint64) (exist bool, err error)
	IsAuditProcessExist(ctx context.Context, auditType string, bindID uint64) (exist bool, err error)
	DeleteByAuditType(ctx context.Context, AuditType string) (err error)
}
