package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func (r *repoImpl) AuditResultUpdate(ctx context.Context, applyID string, alterInfo map[string]interface{}) error {
	err := r.db(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(new(model.DBSandboxApply)).Where("id = ? ",
			applyID).UpdateColumns(alterInfo).Error; err != nil {
			return err
		}
		//插入日志
		logCount := int64(0)
		step := constant.SandboxExecuteStepAuditing.Integer.Int32()
		if err := tx.Model(new(model.DBSandboxLog)).Where("apply_id=? and execute_step=?", applyID, step).Count(&logCount).Error; err != nil {
			return err
		}
		if logCount <= 0 {
			//查询申请
			applyData := &model.DBSandboxApply{}
			if tx.Where("id=?", applyID).Take(&applyData).Error == nil {
				return tx.Create(applyData.GenLog(step)).Error
			}
		}
		return nil
	})
	return err
}

// UpdateAuditStateWhileDelProc 如果审核流程被删除，取消审核，审核撤销
func (r *repoImpl) UpdateAuditStateWhileDelProc(ctx context.Context, procDefKeys []string) (bool, error) {
	db := r.data.DB.WithContext(ctx).Model(new(model.DBSandboxApply)).
		Where("proc_def_key in ?", procDefKeys).
		UpdateColumns(map[string]interface{}{
			"audit_state":  constant.AuditStatusReject,
			"audit_advice": "流程被删除，审核撤销",
		})
	return db.RowsAffected > 0, db.Error
}

func (r *repoImpl) FlowUpdateApply(ctx context.Context, data *model.DBSandboxApply) error {
	return r.db(ctx).Where("id=?", data.ID).Updates(data).Error
}
