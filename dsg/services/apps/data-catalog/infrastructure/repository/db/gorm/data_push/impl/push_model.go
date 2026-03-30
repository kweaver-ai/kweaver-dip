package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type RepoImpl struct {
	data *db.Data
}

func NewRepoImpl(data *db.Data) data_push.Repo {
	return &RepoImpl{
		data: data,
	}
}

func (r *RepoImpl) Insert(ctx context.Context, data *model.TDataPushModel, fields []*model.TDataPushField) error {
	err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&data).Error; err != nil {
			return err
		}
		if err := tx.Create(&fields).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *RepoImpl) Get(ctx context.Context, id uint64) (*model.TDataPushModel, error) {
	data := &model.TDataPushModel{}
	err := r.data.DB.WithContext(ctx).Where("id=?", id).Take(data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return data, err
}

func (r *RepoImpl) QuerySandboxCount(ctx context.Context, req *domain.QuerySandboxPushReq) (objs []string, err error) {
	rawSQL := "select  concat(id,',',target_sandbox_id ) from t_data_push_model  where target_sandbox_id in ? and deleted_at=0;"
	err = r.data.DB.Raw(rawSQL, req.AuthedSandboxID).Scan(&objs).Error
	return objs, err
}

func (r *RepoImpl) Query(ctx context.Context, req *domain.ListPageReq) (total int64, objs []*model.TDataPushModel, err error) {
	db := r.data.DB.WithContext(ctx).Model(new(model.TDataPushModel))
	//状态过滤
	if req.Status != "" {
		status := strings.Replace(req.Status, " ", "", -1)
		db = db.Where(fmt.Sprintf("push_status in (%s)", status))
	} else {
		//不展示隐藏的状态的
		db = db.Where("push_status > ?", constant.DataPushStatusShadow.Integer.Int32())
	}
	//开始时间范围过滤
	if req.StartTime != nil && *req.StartTime > 0 {
		startTime := time.UnixMilli(*req.StartTime)
		db = db.Where("created_at > ? ", startTime)
	}
	if req.EndTime != nil && *req.EndTime > 0 {
		endTime := time.UnixMilli(*req.EndTime)
		db = db.Where("created_at < ? ", endTime)
	}
	//来源部门
	if len(req.SourceDepartmentIDPath) > 0 {
		db = db.Where("source_department_id in (?)", req.SourceDepartmentIDPath)
	}
	//目标部门
	if len(req.TargetDepartmentIDPath) > 0 {
		db = db.Where("target_department_id in (?)", req.TargetDepartmentIDPath)
	}
	//查询沙箱
	if len(req.AuthedSandboxID) > 0 {
		db = db.Where("target_sandbox_id in (?)", req.AuthedSandboxID)
	}
	//关键字模糊查询
	if req.Keyword != "" {
		keyword := util.KeywordEscape(req.Keyword)
		if req.WithSandboxInfo {
			db = db.Where(" target_table_name LIKE ?", "%"+keyword+"%")
		} else {
			db = db.Where("name LIKE ?", "%"+keyword+"%")
		}
	}
	//总数
	if err = db.Count(&total).Error; err != nil {
		return 0, nil, err
	}
	//分页
	db = db.Order(*req.Sort + " " + *req.Direction).Limit(*req.Limit).Offset(req.OffsetNumber())
	err = db.Find(&objs).Error
	return total, objs, err
}

func (r *RepoImpl) UpdateStatus(ctx context.Context, data *model.TDataPushModel) error {
	return r.data.DB.WithContext(ctx).Where("id=?", data.ID).Select("push_status").Updates(data).Error
}
func (r *RepoImpl) Update(ctx context.Context, data *model.TDataPushModel, fields []*model.TDataPushField) error {
	err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id=?", data.ID).Updates(&data).Error; err != nil {
			return err
		}
		for _, field := range fields {
			if err := tx.Where("model_id=? and source_tech_name=?", field.ModelID, field.SourceTechName).Updates(&field).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *RepoImpl) UpdateSchedule(ctx context.Context, data *model.TDataPushModel) error {
	return r.data.DB.WithContext(ctx).Where("id=?", data.ID).Select("audit_state", "push_status", "operation", "schedule_type", "schedule_time", "schedule_start", "schedule_end", "crontab_expr").Updates(&data).Error
}

func (r *RepoImpl) Delete(ctx context.Context, tx *gorm.DB, id uint64) error {
	if err := tx.WithContext(ctx).Where("id=?", id).Delete(&model.TDataPushModel{}).Error; err != nil {
		return err
	}
	if err := tx.WithContext(ctx).Where("model_id=?", id).Delete(&model.TDataPushField{}).Error; err != nil {
		return err
	}
	return nil
}

func (r *RepoImpl) AnnualStatistics(ctx context.Context) (data []*domain.AnnualStatisticItem, err error) {
	sb := &strings.Builder{}
	sb.WriteString("select ")
	data = make([]*domain.AnnualStatisticItem, 0, 12)
	startTime := time.Now()
	for m := range 12 {
		st := startTime.Format("200601")
		sb.WriteString("  count(date_format(tdpm.created_at , '%Y%m')='")
		sb.WriteString(st)
		sb.WriteString("' or null) as '")
		sb.WriteString(st)
		sb.WriteString("'")
		if m < 11 {
			sb.WriteString(", ")
		}
		//result
		data = append(data, &domain.AnnualStatisticItem{Month: st})
		//循环
		startTime = startTime.AddDate(0, -1, 0)
	}
	sb.WriteString(" from t_data_push_model tdpm  where tdpm.created_at > date_sub(CURDATE(), interval 1 YEAR)   ")
	results := make(map[string]any)
	err = r.data.DB.WithContext(ctx).Raw(sb.String()).Scan(&results).Error
	if err != nil {
		return nil, err
	}
	for i := range data {
		data[i].Count = results[data[i].Month]
	}
	return data, err
}

func (r *RepoImpl) Overview(ctx context.Context, req *domain.OverviewReq) (data *domain.OverviewResp, err error) {
	rawSQL := "select  count(*) as total,  " +
		"count(audit_state=? or null ) as auditing,  " +
		"count((push_status=? or push_status=?) or null ) as waiting,  " +
		"count(push_status=? or null ) as starting,  " +
		"count(push_status=? or null ) as going,  " +
		"count(push_status=? or null ) as stopped,  " +
		"count(push_status=? or null ) as end  " +
		"from t_data_push_model  "
	conditions := make([]string, 0)
	params := make([]any, 0)
	params = append(params,
		constant.DataPushAuditStatusWaiting.Integer.Int32(),
		constant.DataPushStatusDraft.Integer.Int32(),
		constant.DataPushStatusWaiting.Integer.Int32(),
		constant.DataPushStatusStarting.Integer.Int32(),
		constant.DataPushStatusGoing.Integer.Int32(),
		constant.DataPushStatusStopped.Integer.Int32(),
		constant.DataPushStatusEnd.Integer.Int32(),
	)
	if len(req.SourceDepartmentID) > 0 {
		condition := "  source_department_id in ? "
		conditions = append(conditions, condition)
		params = append(params, req.SourceDepartmentID)
	}
	if req.StartTime != nil && req.EndTime != nil {
		condition := " created_at > ?  and  created_at < ? "
		conditions = append(conditions, condition)
		params = append(params, time.UnixMilli(*req.StartTime), time.UnixMilli(*req.EndTime))
	}
	if len(conditions) > 0 {
		rawSQL += fmt.Sprintf(" where %v  ", strings.Join(conditions, "  and "))
	}
	err = r.data.DB.WithContext(ctx).Raw(rawSQL, params...).Scan(&data).Error
	return data, err
}

// QueryUnFinished 查询未完成的,未开始的
// 一次性的任务，周期性的，周期已经开始的
func (r *RepoImpl) QueryUnFinished(ctx context.Context) (objs []*model.TDataPushModel, err error) {
	auditStatusSlice := []int{
		constant.AuditStatusPass,
		constant.AuditStatusUnaudited,
	}
	session := r.data.DB.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	session = session.WithContext(ctx).Where("audit_state in ? ", auditStatusSlice)
	condition := `
     (	push_status=? and 
		(
	 		(schedule_type = ? and  schedule_time='') 
			or (schedule_time != '' and STR_TO_DATE(schedule_time, '%Y-%m-%d %H:%i:%s') < NOW() )
			or (schedule_end != '' and STR_TO_DATE(schedule_end, '%Y-%m-%d') <= CURDATE())
		)
	) 
	or 
	(	push_status=? and 
		(
			(schedule_type = ? and  schedule_time='' )
			or (schedule_time != '' and STR_TO_DATE(schedule_time, '%Y-%m-%d %H:%i:%s') < NOW() )
			or (schedule_start != '' and STR_TO_DATE(schedule_start, '%Y-%m-%d') <= CURDATE())
		)
	)`
	session = session.Where(condition, constant.DataPushStatusGoing.Integer.Int32(), constant.ScheduleTypeOnce.String,
		constant.DataPushStatusStarting.Integer.Int32(), constant.ScheduleTypeOnce.String)
	return gormx.RawScan[*model.TDataPushModel](session)
}
