package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_explore_sub_task"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func NewExploreTaskRepo(db *gorm.DB) tmp_explore_sub_task.TmpExploreSubTaskRepo {
	return &tmpExploreSubTaskRepo{db: db}
}

type tmpExploreSubTaskRepo struct {
	db *gorm.DB
}

func (r *tmpExploreSubTaskRepo) Create(ctx context.Context, m *model.TmpExploreSubTask) error {
	return r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).Create(m).Error
}

func (r *tmpExploreSubTaskRepo) BatchCreate(ctx context.Context, m []*model.TmpExploreSubTask) error {
	return r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).CreateInBatches(m, 1000).Error
}

func (r *tmpExploreSubTaskRepo) GetByID(ctx context.Context, subTaskId uint64) (*model.TmpExploreSubTask, error) {
	var subtask *model.TmpExploreSubTask
	err := r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).Where("id = ?", subTaskId).Take(&subtask).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		log.WithContext(ctx).Error("tmpExploreSubTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return subtask, err
}

func (r *tmpExploreSubTaskRepo) Get(ctx context.Context, parentTaskId string, status []int32, limit int) ([]*model.TmpExploreSubTask, error) {
	var (
		tmpExploreSubTasks []*model.TmpExploreSubTask
		err                error
	)
	d := r.db.WithContext(ctx).
		Model(&model.TmpExploreSubTask{}).
		Where("parent_task_id = ?", parentTaskId)
	if len(status) > 0 {
		d = d.Where("status in ?", status)
	}
	d = d.Order("id asc")
	if limit > 0 {
		d = d.Offset(0).Limit(limit)
	}
	err = d.Find(&tmpExploreSubTasks).Error
	if err != nil {
		log.WithContext(ctx).Error("tmpExploreSubTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return tmpExploreSubTasks, err
}

func (r *tmpExploreSubTaskRepo) GetByStatus(ctx context.Context, status []int32) ([]string, error) {
	var formViewIds []string
	err := r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).Distinct("form_view_id").Where("status in ?", status).Find(&formViewIds).Error
	if err != nil {
		log.WithContext(ctx).Error("tmpExploreSubTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return formViewIds, err
}

func (r *tmpExploreSubTaskRepo) Update(ctx context.Context, m *model.TmpExploreSubTask) error {
	return r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).Where("id = ?", m.ID).Updates(m).Error
}

func (r *tmpExploreSubTaskRepo) Delete(ctx context.Context, parentTaskId string) error {
	t := &model.TmpExploreSubTask{}
	d := r.db.WithContext(ctx).Model(t).Where("1=1")
	if len(parentTaskId) > 0 {
		d = d.Where("parent_task_id = ?", parentTaskId)
	}
	return d.Delete(t).Error
}

func (r *tmpExploreSubTaskRepo) UpdateStatusByParentTaskID(ctx context.Context, parentTaskId string, status int32) error {
	return r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).Where("parent_task_id = ?", parentTaskId).UpdateColumn("status", status).Error
}

func (r *tmpExploreSubTaskRepo) GetByFormIds(ctx context.Context, ids []string, status []int32) ([]string, error) {
	var formViewIds []string
	err := r.db.WithContext(ctx).Model(&model.TmpExploreSubTask{}).Distinct("form_view_id").Where("form_view_id in ? and status in ?", ids, status).Find(&formViewIds).Error
	if err != nil {
		log.WithContext(ctx).Error("tmpExploreSubTaskRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	return formViewIds, err
}
