package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// Executing 待实施改为实施中，如果有实施就更新，没有就插入
func (r *repoImpl) Executing(ctx context.Context, data *model.DBSandboxExecution) (err error) {
	err = r.db(ctx).Transaction(func(tx *gorm.DB) error {
		existExecution := &model.DBSandboxExecution{}
		err = tx.Where("apply_id=?", data.ApplyID).Take(&existExecution).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err != nil {
			return tx.Create(data).Error
		}
		data.ID = existExecution.ID
		if err = tx.Where("id=?", data.ID).Updates(data).Error; err != nil {
			return err
		}
		//更新下申请的状态
		applyStatus := constant.SandboxStatusExecuting.Integer.Int32()
		if err = tx.Model(new(model.DBSandboxApply)).Where("id=?", data.ApplyID).Update("status", applyStatus).Error; err != nil {
			return err
		}
		//再次更新下沙箱空间的密码信息
		updateColumns := map[string]any{
			"datasource_id":        data.DatasourceID,
			"datasource_name":      data.DatasourceName,
			"datasource_type_name": data.DatasourceTypeName,
			"database_name":        data.DatabaseName,
			"username":             data.Username,
			"password":             data.Password,
		}
		if err = tx.Model(new(model.DBSandbox)).Where("id=?", data.SandboxID).Updates(updateColumns).Error; err != nil {
			return err
		}
		if err = tx.Model(new(model.DBSandbox)).Where("datasource_id=?", data.DatasourceID).Updates(updateColumns).Error; err != nil {
			return err
		}
		//添加日志
		executingLog := data.GenLog(constant.SandboxExecuteStepExecution.Integer.Int32())
		return tx.Create(executingLog).Error
	})
	return err
}

// Executed 实施完成是一个更新操作
func (r *repoImpl) Executed(ctx context.Context, data *model.DBSandboxExecution) (err error) {
	err = r.db(ctx).Transaction(func(tx *gorm.DB) error {
		if err = tx.Where("id=?", data.ID).Updates(data).Error; err != nil {
			return err
		}
		//更新下申请状态
		applyStatus := constant.SandboxStatusCompleted.Integer.Int32()
		if err = tx.Model(new(model.DBSandboxApply)).Where("id=?", data.ApplyID).Update("status", applyStatus).Error; err != nil {
			return err
		}
		//增加下容量
		applyObj := &model.DBSandboxApply{}
		if err = tx.Where("id=?", data.ApplyID).First(&applyObj).Error; err != nil {
			return err
		}
		alterColumn := map[string]any{
			"total_space": gorm.Expr("total_space+?", applyObj.RequestSpace),
			"status":      constant.SandboxSpaceStatusAvailable.Integer.Int32(),
		}
		err = tx.Model(new(model.DBSandbox)).Where("id=? ", data.SandboxID).Updates(alterColumn).Error
		if err != nil {
			return err
		}
		//添加日志
		executedLog := data.GenLog(constant.SandboxExecuteStepCompleted.Integer.Int32())
		return tx.Create(executedLog).Error
	})
	return err
}

func (r *repoImpl) GetExecutionDetail(ctx context.Context, id string) (data *domain.SandboxExecutionDetail, err error) {
	rawSQL := "select dse.id, dse.apply_id ,dse.sandbox_id, ds.project_id ,tp.name as project_name, dsa.applicant_id, dsa.applicant_name,  " +
		"ds.department_id ,ds.department_name ,ds.total_space,dsa.request_space, ds.valid_start ,ds.valid_end ,dsa.reason ,dsa.apply_time,  " +
		"dse.execute_type ,ds.datasource_name ,ds.datasource_type_name ,ds.database_name , ds.username ,ds.password ,  " +
		"dsa.operation ,dse.executed_time , dse.description,  dse.executed_time  from db_sandbox_execution dse   " +
		"join db_sandbox_apply dsa on dse.apply_id=dsa.id " +
		"join  db_sandbox ds on ds.id=dsa.sandbox_id " +
		"join tc_project tp on ds.project_id=tp.id  " +
		"where ds.deleted_at=0 and tp.deleted_at=0 and dse.deleted_at=0 and dse.id=?"
	err = r.db(ctx).Raw(rawSQL, id).Scan(&data).Error
	if err == nil && data == nil {
		return nil, errorcode.PublicResourceNotFoundError.Err()
	}
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Err()
	}
	return data, err
}

func (r *repoImpl) GetExecution(ctx context.Context, id string) (data *model.DBSandboxExecution, err error) {
	err = r.db(ctx).Where("id=?", id).First(&data).Error
	return data, errorcode.WrapNotfoundError(err)
}

func (r *repoImpl) ListExecution(ctx context.Context, req *domain.SandboxExecutionListArg) (data []*domain.SandboxExecutionListItem, total int64, err error) {
	sb := new(strings.Builder)
	executionListColumn := ` dse.id, dse.apply_id ,dse.sandbox_id, ds.project_id ,tp.name as project_name, dsa.applicant_id,
		dsa.applicant_name,dsa.applicant_phone, ds.username,ds.password, dsa.operation, dse.execute_type, dse.execute_status ,
        dse.executor_id, dse.executor_id, dse.executor_name, dse.executed_time, dsa.request_space  `
	executionListTotal := ` count(dse.id) `

	sb.WriteString(`select  %s from db_sandbox_execution dse
		join db_sandbox_apply dsa on dse.apply_id=dsa.id
		join  db_sandbox ds on ds.id=dsa.sandbox_id
		join tc_project tp on ds.project_id=tp.id
		where ds.deleted_at=0 and tp.deleted_at=0 and dse.deleted_at=0 `)
	//不是运营人员只能看到自己的和自己所在项目的
	args := make([]interface{}, 0)
	if !req.IsDataOperationEngineer() {
		sb.WriteString(" and ds.project_id in  ?  or  (dsa.applicant_id =? and  ds.applicant_id=? )")
		args = append(args, req.AuthorizedProjects, req.ApplicantID, req.ApplicantID)
	}
	if req.ExecuteType != "" {
		sb.WriteString(" and dsa.operation = ? ")
		args = append(args, enum.ToInteger[constant.SandboxOperation](req.ExecuteType).Int32())
	}
	if ss := req.SandboxStatus(); len(ss) > 0 {
		sb.WriteString(" and dse.execute_status in ? ")
		args = append(args, ss)
	}
	if req.Keyword != "" {
		sb.WriteString(" and tp.name like ?")
		args = append(args, "%"+util.KeywordEscape(req.Keyword)+"%")
	}
	//获得总数
	if err = r.db(ctx).Raw(fmt.Sprintf(sb.String(), executionListTotal), args...).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if req.Sort != nil {
		sb.WriteString(fmt.Sprintf(" order by %s %s", *req.Sort, *req.Direction))
	}
	sb.WriteString(" limit ? offset ? ")
	args = append(args, req.DBOLimit(), req.DBOffset())
	//获得具体的数据
	if err = r.db(ctx).Raw(fmt.Sprintf(sb.String(), executionListColumn), args...).Scan(&data).Error; err != nil {
		return nil, 0, err
	}
	return data, total, nil
}

// GetApplyLogList  查询空间申请的整个流程的日志
func (r *repoImpl) GetApplyLogList(ctx context.Context, applyID string) (data []*domain.SandboxExecutionLogListItem, err error) {
	err = r.db(ctx).Model(new(model.DBSandboxLog)).Where("apply_id=?", applyID).Order("execute_step").Find(&data).Error
	return data, err
}

// InsertExecution  插入执行信息，同时修改申请的状态
func (r *repoImpl) InsertExecution(ctx context.Context, executionData *model.DBSandboxExecution, applyData *model.DBSandboxApply) (err error) {
	err = r.db(ctx).Transaction(func(tx *gorm.DB) error {
		if err = tx.Create(executionData).Error; err != nil {
			return err
		}
		if err = tx.Where("id=?", applyData.ID).Updates(applyData).Error; err != nil {
			return err
		}
		return nil
	})
	return err
}
