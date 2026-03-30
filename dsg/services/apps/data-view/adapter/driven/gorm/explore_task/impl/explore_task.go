package impl

import (
	"context"

	"gorm.io/gorm/logger"

	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_task"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func NewExploreTaskRepo(db *gorm.DB) explore_task.ExploreTaskRepo {
	return &exploreTaskRepo{db: db}
}

type exploreTaskRepo struct {
	db *gorm.DB
}

func (r *exploreTaskRepo) Create(ctx context.Context, m *model.ExploreTask) (id string, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Create(m).Error
	if err != nil {
		return "", err
	}
	return m.TaskID, nil
}

func (r *exploreTaskRepo) GetV1(ctx context.Context, taskId string, status []int32, types []int32, limit int, offset int) (exploreTasks []*model.ExploreTask, err error) {
	session := r.db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	d := session.WithContext(ctx).Model(&model.ExploreTask{})
	if len(taskId) > 0 {
		d = d.Where("task_id = ?", taskId)
	}
	if len(status) > 0 {
		d = d.Where("status in ?", status)
	}
	if len(types) > 0 {
		d = d.Where("type in ?", types)
	}
	d = d.Where("deleted_at=0 or deleted_at is null").Order("created_at asc").Limit(limit).Offset(offset)
	err = d.Find(&exploreTasks).Error
	if err != nil {
		log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) Get(ctx context.Context, taskId string) (exploreTask *model.ExploreTask, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("task_id =? and deleted_at=0", taskId).Take(&exploreTask).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.TaskIdNotExist)
		}
		log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) GetByTaskId(ctx context.Context, taskId string) (exploreTask *model.ExploreTask, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("task_id =? and deleted_at=0", taskId).Take(&exploreTask).Error
	return
}

func (r *exploreTaskRepo) GetExploreTime(ctx context.Context, datasourceId string) (exploreTime int64, err error) {
	var exploreTask *model.ExploreTask
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("datasource_id =?", datasourceId).Order("created_at desc").Take(&exploreTask).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil
		}
		log.WithContext(ctx).Error("exploreTaskRepo GetStatus DatabaseError", zap.Error(err))
		return 0, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return exploreTask.CreatedAt.UnixMilli(), nil
}

func (r *exploreTaskRepo) GetStatus(ctx context.Context, formViewId, datasourceId string) (exploreTask []*model.ExploreTask, err error) {
	if formViewId != "" {
		err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("form_view_id =?", formViewId).Order("created_at desc").Find(&exploreTask).Error
	} else if datasourceId != "" {
		err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("datasource_id =? and form_view_id =''", datasourceId).Order("created_at desc").Find(&exploreTask).Error
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		log.WithContext(ctx).Error("exploreTaskRepo GetStatus DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) CheckTaskRepeat(ctx context.Context, formViewId, datasourceId string, exploreType int32) (exploreTask *model.ExploreTask, err error) {
	if formViewId != "" {
		err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("form_view_id =? and type = ? and status in (1,2)", formViewId, exploreType).Order("created_at desc").Take(&exploreTask).Error
	} else if datasourceId != "" {
		err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("datasource_id =? and form_view_id ='' and type = ? and status in (1,2)", datasourceId, exploreType).Order("created_at desc").Take(&exploreTask).Error
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		log.WithContext(ctx).Error("exploreTaskRepo GetStatus DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) UpdateV1(ctx context.Context, m *model.ExploreTask, status []int32) error {
	d := r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("task_id =?", m.TaskID)
	if len(status) > 0 {
		d = d.Where("status in ?", status)
	}
	return d.Updates(m).Error
}

func (r *exploreTaskRepo) GetConfigByFormViewId(ctx context.Context, formViewId string) (exploreTask *model.ExploreTask, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("form_view_id =? and config <> ''", formViewId).Order("created_at desc").Take(&exploreTask).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.TaskIdNotExist)
		}
		log.WithContext(ctx).Error("exploreTaskRepo GetConfigByFormViewId DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) GetConfigByDatasourceId(ctx context.Context, datasourceId string) (exploreTask *model.ExploreTask, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("datasource_id =? and config <> ''", datasourceId).Order("created_at desc").Take(&exploreTask).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.TaskIdNotExist)
		}
		log.WithContext(ctx).Error("exploreTaskRepo GetConfigByDatasourceId DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) GetConfigsByDatasourceId(ctx context.Context, datasourceId string) (exploreTasks []*model.ExploreTask, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("datasource_id =? and form_view_id <> '' and config <> ''", datasourceId).Order("created_at desc").Find(&exploreTasks).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.TaskIdNotExist)
		}
		log.WithContext(ctx).Error("exploreTaskRepo GetConfigByDatasourceId DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}

func (r *exploreTaskRepo) Update(ctx context.Context, m *model.ExploreTask) error {
	return r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("task_id =?", m.TaskID).Save(m).Error
}

func (r *exploreTaskRepo) Delete(ctx context.Context, taskId string) error {
	return r.db.WithContext(ctx).Model(&model.ExploreTask{}).Where("task_id =?", taskId).Delete(&model.ExploreTask{}).Error
}

func (r *exploreTaskRepo) GetListByWorkOrderIDs(ctx context.Context, workOrderIDs []string) (exploreTasks []*model.ExploreTask, err error) {
	err = r.db.WithContext(ctx).
		Model(&model.ExploreTask{}).
		Where("work_order_id in ? and id in (select max(id) from explore_task where work_order_id in ? group by datasource_id, form_view_id)", workOrderIDs, workOrderIDs).
		Order("datasource_id asc, form_view_id asc").
		Find(&exploreTasks).Error
	return exploreTasks, err
}

func (r *exploreTaskRepo) GetList(ctx context.Context, req *domain.ListExploreTaskReq, userId string) (total int64, tasks []*domain.TaskInfo, err error) {
	db := r.db.WithContext(ctx)
	if len(req.WorkOrderId) == 0 {
		db = db.Table("(select * from explore_task where created_by_uid = ? and (work_order_id is null or work_order_id = '')) e", userId)
	} else {
		db = db.Table("(select * from explore_task where work_order_id = ? and id in (select max(id) from explore_task where work_order_id = ? group by datasource_id, form_view_id)) e", req.WorkOrderId, req.WorkOrderId)
	}
	db = db.Select("e.*,e.created_by_uid as created_by,f.business_name as form_view_name,f.type as form_view_type,d.name as datasource_name,d.type_name as datasource_type").
		Joins("LEFT JOIN form_view f ON e.form_view_id = f.id").
		Joins("LEFT JOIN datasource d ON e.datasource_id = d.id").Where("e.deleted_at = 0")
	// if req.WorkOrderId == "" {
	// 	db = db.Where("e.created_by_uid = ?", userId)
	// }
	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("(f.business_name <> '' and f.business_name like ?) or (f.business_name is NULL and d.name like ?)", keyword, keyword)
	}
	if req.Type != "" {
		arr := strings.Split(req.Type, ",")
		taskTypes := make([]int32, 0)
		for _, t := range arr {
			taskType := enum.ToInteger[domain.TaskType](t).Int32()
			if taskType > 0 {
				taskTypes = append(taskTypes, taskType)
			}
		}
		if len(taskTypes) > 0 {
			db = db.Where("e.type in  ?", taskTypes)
		}
	}
	if req.Status != "" {
		arr := strings.Split(req.Status, ",")
		status := make([]int32, 0)
		for _, s := range arr {
			si := enum.ToInteger[domain.TaskStatus](s).Int32()
			if si > 0 {
				status = append(status, si)
			}
		}
		if len(status) > 0 {
			db = db.Where("e.status in  ?", status)
		}
	}
	// if req.WorkOrderId == "" {
	// 	db = db.Where("e.work_order_id is null or e.work_order_id = ''")
	// } else {
	// 	db = db.Where("e.work_order_id = ?", req.WorkOrderId)
	// }
	err = db.Debug().Count(&total).Error
	if err != nil {
		return total, tasks, err
	}
	if req.Limit != nil && req.Offset != nil {
		limit := *req.Limit
		offset := limit * (*req.Offset - 1)
		if limit > 0 {
			db = db.Limit(limit).Offset(offset)
		}
	}
	db = db.Debug().Order(fmt.Sprintf("%s %s", req.Sort, req.Direction)).Find(&tasks)
	return total, tasks, err
}

func (r *exploreTaskRepo) GetDetail(ctx context.Context, taskId string) (exploreTask *domain.TaskInfo, err error) {
	db := r.db.WithContext(ctx).Table("explore_task e")
	err = db.Select("e.*,f.business_name as form_view_name,f.type as form_view_type,d.name as datasource_name,d.type_name as datasource_type").
		Joins("LEFT JOIN form_view f ON e.form_view_id = f.id").
		Joins("LEFT JOIN datasource d ON e.datasource_id = d.id").Where("e.task_id = ? and e.deleted_at = 0", taskId).Take(&exploreTask).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.TaskIdNotExist)
		}
		log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return
}
