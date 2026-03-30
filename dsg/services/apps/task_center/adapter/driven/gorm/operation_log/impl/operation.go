package impl

import (
	"context"
	"fmt"

	operationLog "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/operation_log"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/operation_log"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type OperationLogRepo struct {
	data *db.Data
}

func NewOperationLogRepo(data *db.Data) operationLog.Repo {
	return &OperationLogRepo{data: data}
}

func (o OperationLogRepo) Insert(ctx context.Context, opLogs ...*model.OperationLog) error {
	ctx = util.StartSpan(ctx)
	defer trace.SpanFromContext(ctx).End()

	logs := make([]*model.OperationLog, 0)
	for _, oplog := range opLogs {
		if oplog != nil {
			logs = append(logs, oplog)
		}
	}
	if len(logs) <= 0 {
		return nil
	}
	if err := o.data.DB.Create(&logs).Error; err != nil {
		log.WithContext(ctx).Error("OperationLogRepo Insert error", zap.Error(err))
		return err
	}
	return nil
}

func (o OperationLogRepo) Get(ctx context.Context, params *domain.OperationLogQueryParams) (total int64, logs []*model.OperationLog, err error) {
	db := o.data.DB.WithContext(ctx).Model(new(*model.OperationLog))
	if params.Obj != "" {
		db = db.Where(" obj=? ", params.Obj)
	}
	if params.ObjId != "" {
		db = db.Where(" obj_id=?", params.ObjId)
	}
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if params.Sort != "" && params.Direction != "" {
		db = db.Order(fmt.Sprintf("%s %s", params.Sort, params.Direction))
	} else {
		db = db.Order("created_at desc")
	}
	if params.Limit > 0 {
		db = db.Offset(int((params.Offset - 1) * params.Limit)).Limit(int(params.Limit))
	}
	err = db.Find(&logs).Error

	return
}
