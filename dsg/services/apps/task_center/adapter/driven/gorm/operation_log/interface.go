package operation_log

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/operation_log"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	Insert(ctx context.Context, opLogs ...*model.OperationLog) error
	Get(ctx context.Context, params *operation_log.OperationLogQueryParams) (int64, []*model.OperationLog, error)
}
