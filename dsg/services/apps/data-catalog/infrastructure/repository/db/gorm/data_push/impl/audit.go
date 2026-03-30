package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

func (r *RepoImpl) AuditResultUpdate(ctx context.Context, dataPushModelID uint64, alterInfo map[string]interface{}) (bool, error) {
	db := r.data.DB.WithContext(ctx).Model(new(model.TDataPushModel)).
		Where("id = ? ", dataPushModelID).
		UpdateColumns(alterInfo)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

// UpdateAuditStateWhileDelProc 如果审核流程被删除，取消审核，审核撤销
func (r *RepoImpl) UpdateAuditStateWhileDelProc(ctx context.Context, procDefKeys []string) (bool, error) {
	db := r.data.DB.WithContext(ctx).Model(new(model.TDataPushModel)).
		Where("proc_def_key in ?", procDefKeys).
		UpdateColumns(map[string]interface{}{
			"audit_state":  constant.AuditStatusReject,
			"audit_advice": "流程被删除，审核撤销",
			"updated_at":   &util.Time{Time: time.Now()},
		})
	return db.RowsAffected > 0, db.Error
}
