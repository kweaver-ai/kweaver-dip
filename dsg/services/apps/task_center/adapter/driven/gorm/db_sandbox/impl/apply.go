package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func (r *repoImpl) CreateApplyWithSpace(ctx context.Context, apply *model.DBSandboxApply, space *model.DBSandbox) error {
	err1 := r.db(ctx).Transaction(func(tx *gorm.DB) error {
		//查询下有没有space
		existSpace := &model.DBSandbox{}
		if err := r.db(ctx).Model(new(model.DBSandbox)).Where("project_id=?", space.ProjectID).Take(&existSpace).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := tx.Create(space).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		} else {
			apply.SandboxID = existSpace.ID
		}
		if err := tx.Create(apply).Error; err != nil {
			return err
		}
		//添加日志
		applyLog := apply.GenLog(constant.SandboxExecuteStepApply.Integer.Int32())
		return tx.Create(applyLog).Error
	})
	if err1 != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err1.Error())
	}
	return nil
}

func (r *repoImpl) CreateExtend(ctx context.Context, apply *model.DBSandboxApply) error {
	err := r.db(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(apply).Error; err != nil {
			return err
		}
		extendLog := apply.GenLog(constant.SandboxExecuteStepExtend.Integer.Int32())
		return tx.Create(extendLog).Error
	})
	return err
}

func (r *repoImpl) GetApplyingCountByProject(ctx context.Context, id string) (count int, err error) {
	raqSQL := "select count(dsa.id) from db_sandbox_apply dsa join db_sandbox ds on dsa.sandbox_id=ds.id " +
		"	where  ( (dsa.status=? and dsa.audit_state in ?) or dsa.status in ? )  and  ds.project_id =? and ds.deleted_at=0 and dsa.deleted_at=0"
	err = r.db(ctx).Raw(raqSQL,
		constant.SandboxStatusApplying.Integer.Int32(),
		[]int32{constant.AuditStatusAuditing.Integer.Int32(), constant.AuditStatusUnaudited.Integer.Int32()},
		constant.OneProjectOneApplyCondition, id).Scan(&count).Error
	return count, err
}

func (r *repoImpl) GetSandboxApplyRecords(ctx context.Context, id string) (data []*domain.ApplyRecord, err error) {
	err = r.db(ctx).Model(new(model.DBSandboxApply)).Where("sandbox_id=?", id).Order("-apply_time").Find(&data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return data, nil
}

func (r *repoImpl) UpdateSandboxApplyAudit(ctx context.Context, data *model.DBSandboxApply) (err error) {
	err = r.db(ctx).Model(new(model.DBSandboxApply)).Where("id=?", data.ID).Updates(&data).Error
	if err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

func (r *repoImpl) GetSandboxApply(ctx context.Context, id string) (data *model.DBSandboxApply, err error) {
	err = r.db(ctx).Where("id=?", id).First(&data).Error
	return data, errorcode.WrapNotfoundError(err)
}

func (r *repoImpl) GetSandboxDetail(ctx context.Context, id string) (data *domain.SandboxSpaceDetail, err error) {
	rawSQL := "select dsa.sandbox_id, ds.applicant_id, ds.applicant_name, ds.applicant_phone, ds.department_id,ds.department_name,ds.project_id," +
		"  tp.name as project_name, tp.owner_id as project_owner_id, ds.total_space, ds.valid_start, ds.valid_end,dsa.operation, dsa.status,dsa.audit_state," +
		"   if (dsa.audit_state=?, 0, dsa.request_space) as request_space from db_sandbox ds  " +
		"  join (select x.* from db_sandbox_apply x group by x.sandbox_id order by x.apply_time desc) dsa on ds.id=dsa.sandbox_id  " +
		"  JOIN tc_project tp on ds.project_id=tp.id  where ds.deleted_at=0 and ds.id =?"
	err = r.db(ctx).Raw(rawSQL, constant.AuditStatusPass.Integer.Int32(), id).Scan(&data).Error
	if err == nil && data == nil {
		return nil, errorcode.PublicResourceNotFoundError.Err()
	}
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Err()
	}
	return data, err
}

// ListApply  申请列表
// 1. 运营人员查看所有的单子
// 2. 本人可以查看自己的单子
// 3. 查看所在项目的单子
func (r *repoImpl) ListApply(ctx context.Context, req *domain.SandboxApplyListArg) (data []*domain.SandboxApplyListItem, total int64, err error) {
	sb := new(strings.Builder)
	applyListColumn := ` dsa.sandbox_id, ds.department_id ,ds.department_name, ds.project_id, tp.name as project_name,
		ds.total_space , if( (dsa.audit_state=? or dsa.audit_state=? ) and dsa.status != ?,  dsa.request_space, 0) as in_apply_space,  
		dsa.request_space as last_apply_space, ds.valid_start, ds.valid_end, dsa.id as apply_id, dsa.applicant_id,dsa.applicant_name, dsa.applicant_phone, 
		dsa.operation, dsa.status as sandbox_status,dsa.audit_state, dsa.audit_advice, dsa.reason, dsa.apply_time, dsa.updated_at `

	applyListTotal := ` count(dsa.id) `

	sb.WriteString(`select %s from db_sandbox ds  
		join (select x.* from ( select t.*  from db_sandbox_apply t 
                order by t.apply_time desc limit 10000 ) x group by x.sandbox_id) dsa on ds.id=dsa.sandbox_id  
        join tc_project tp on ds.project_id=tp.id
		where ds.deleted_at=0`)
	//不是运营人员只能看到自己的和自己所在项目的
	args := make([]interface{}, 0)
	//运营人员查看自己申请的
	isDataOperationEngineer := req.IsDataOperationEngineer()
	if (isDataOperationEngineer && req.OnlySelf) || !isDataOperationEngineer {
		sb.WriteString(" and dsa.applicant_id =? and  ds.applicant_id=? ")
		args = append(args, req.ApplicantID, req.ApplicantID)
	}
	if req.DepartmentID != "" {
		sb.WriteString(" and ds.department_id in (?)")
		args = append(args, req.ChildDepartmentIDSlice)
	}
	if req.ApplyTimeStart > 0 {
		startTime := time.Unix(req.ApplyTimeStart/1000, 0)
		sb.WriteString(" and dsa.apply_time >=  ? ")
		args = append(args, startTime)
	}
	if req.ApplyTimeEnd > 0 {
		endTime := time.Unix(req.ApplyTimeEnd/1000, 0)
		sb.WriteString(" and dsa.apply_time <  ? ")
		args = append(args, endTime)
	}
	if ss := req.SandboxStatus(); len(ss) > 0 {
		sb.WriteString(" and dsa.status in ? ")
		args = append(args, ss)
	}
	if req.Keyword != "" {
		sb.WriteString(" and tp.name like ?")
		args = append(args, "%"+util.KeywordEscape(req.Keyword)+"%")
	}
	//获得总数
	if err = r.db(ctx).Raw(fmt.Sprintf(sb.String(), applyListTotal), args...).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	//获得具体的数据
	if req.Sort != nil {
		sb.WriteString(fmt.Sprintf(" order by %s %s", *req.Sort, *req.Direction))
	}
	sb.WriteString(" limit ? offset ? ")
	args = append(args, req.DBOLimit(), req.DBOffset())

	newArgs := make([]any, 0)
	newArgs = append(newArgs, constant.AuditStatusAuditing.Integer.Int32(), constant.AuditStatusPass.Integer.Int32())
	newArgs = append(newArgs, constant.SandboxStatusCompleted.Integer.Int32())
	newArgs = append(newArgs, args...)
	if err = r.db(ctx).Raw(fmt.Sprintf(sb.String(), applyListColumn), newArgs...).Scan(&data).Error; err != nil {
		return nil, 0, err
	}
	return data, total, nil
}
