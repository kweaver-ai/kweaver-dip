package task_config

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

type Repo interface {
	Create(tx *gorm.DB, ctx context.Context, m *model.TaskConfig) error
	Update(tx *gorm.DB, ctx context.Context, m *model.TaskConfig) error
	UpdateVersionState(tx *gorm.DB, ctx context.Context, taskId uint64) error
	Get(tx *gorm.DB, ctx context.Context, fid uint64) (*model.TaskConfig, error)
	GetLatestByTaskId(tx *gorm.DB, ctx context.Context, taskid uint64) (*model.TaskConfig, error)
	GetByTaskIdAndVersion(tx *gorm.DB, ctx context.Context, taskid uint64, version int32) (*model.TaskConfig, error)
	SoftDelete(tx *gorm.DB, ctx context.Context, m *model.TaskConfig) error
	ListByPage(ctx context.Context, page *request.PageInfo, tableId *string) ([]*model.TaskConfig, int64, error)
	GetLatestByTaskIds(tx *gorm.DB, ctx context.Context, taskIds []uint64) ([]*model.TaskConfig, error)
	UpdateExecStatus(tx *gorm.DB, ctx context.Context, taskId uint64, execStatus int32) error
	UpdateExecStatusByDvTaskId(tx *gorm.DB, ctx context.Context, dvTaskId string, execStatus int32) error
	ListByCatalogSchema(ctx context.Context, catalog, schema string) ([]*model.TaskConfig, int64, error)
	ListByDvTaskId(ctx context.Context, dvTaskId string, status []int32) ([]*model.TaskConfig, int64, error)
	GetUnfinished(ctx context.Context, execStatus []int32) ([]*model.TaskConfig, error)

	GetTaskV2(ctx context.Context, exploreTypes []int32, execStatus []int32) ([]*model.TaskConfig, error)
	UpdateExecStatusV2(tx *gorm.DB, ctx context.Context, taskId uint64, version int32, execStatus int32) error
}

type repo struct {
	data *db.Data
}

func NewRepo(data *db.Data) Repo {
	return &repo{data: data}
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TaskConfig) error {
	if err := r.do(tx, ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return errors.Wrap(err, "Create failed in db")
	}

	return nil
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.TaskConfig) error {
	do := r.do(tx, ctx)
	tx = do.Model(&model.TaskConfig{ID: m.ID}).Updates(m)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		if mariadb.Is(tx.Error, mariadb.ER_DUP_ENTRY) {
			return nil
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}
	return nil
}

func (r *repo) SoftDelete(tx *gorm.DB, ctx context.Context, m *model.TaskConfig) error {
	if err := r.do(tx, ctx).Exec(
		"update t_task_config set f_deleted_at=?,f_deleted_by_uid=?,f_deleted_by_uname=? where f_task_id=?",
		m.DeletedAt, m.DeletedByUID, m.DeletedByUname, m.TaskID).Error; err != nil {
		return errors.Wrap(err, "Update SoftDelete failed in db")
	}
	return nil
}

func (r *repo) UpdateVersionState(tx *gorm.DB, ctx context.Context, taskId uint64) error {
	if err := r.do(tx, ctx).Exec(
		"update t_task_config set f_version_state=0 where f_task_id=?",
		taskId).Error; err != nil {
		return errors.Wrap(err, "Update UpdateVersionState failed in db")
	}
	return nil
}

func (r *repo) UpdateExecStatus(tx *gorm.DB, ctx context.Context, taskId uint64, execStatus int32) error {
	if err := r.do(tx, ctx).Exec(
		"update t_task_config set f_exec_status=? where f_task_id=?",
		execStatus, taskId).Error; err != nil {
		return errors.Wrap(err, "Update UpdateExecStatus failed in db")
	}
	return nil
}

func (r *repo) UpdateExecStatusByDvTaskId(tx *gorm.DB, ctx context.Context, dvTaskId string, execStatus int32) error {
	if err := r.do(tx, ctx).Exec(
		"update t_task_config set f_exec_status=? where f_dv_task_id=? and f_exec_status in (1,2)",
		execStatus, dvTaskId).Error; err != nil {
		return errors.Wrap(err, "Update UpdateExecStatus failed in db")
	}
	return nil
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, fid uint64) (*model.TaskConfig, error) {
	var ms []*model.TaskConfig
	if err := r.do(tx, ctx).Raw(
		"select * from t_task_config where f_id=? limit 1",
		fid).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Getby id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetLatestByTaskId(tx *gorm.DB, ctx context.Context, taskId uint64) (*model.TaskConfig, error) {
	var ms []*model.TaskConfig
	if err := r.do(tx, ctx).Raw(
		"select * from t_task_config where f_task_id=? and f_version_state=1 limit 1",
		taskId).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Getby id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetLatestByTaskIds(tx *gorm.DB, ctx context.Context, taskIds []uint64) ([]*model.TaskConfig, error) {
	var ms []*model.TaskConfig
	if err := r.do(tx, ctx).Raw(
		"select * from t_task_config where f_task_id in (?) and f_version_state=1 and f_deleted_at is null",
		taskIds).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Getby id failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) GetByTaskIdAndVersion(tx *gorm.DB, ctx context.Context, taskId uint64, version int32) (*model.TaskConfig, error) {
	var ms []*model.TaskConfig
	if err := r.do(tx, ctx).Raw(
		"select * from t_task_config where f_task_id=? and f_version = ? and f_deleted_at is null limit 1",
		taskId, version).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Getby id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) ListByPage(ctx context.Context, page *request.PageInfo, tableId *string) ([]*model.TaskConfig, int64, error) {
	var total int64
	var models []*model.TaskConfig
	var offset = *page.Offset
	var limit = *page.Limit
	var sort = *page.Sort
	var direction = *page.Direction

	offset = limit * (offset - 1)

	if err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		if tableId != nil && len(*tableId) > 0 {
			tx = tx.Where("f_table_id = ?", tableId)
		}
		tx = tx.Where("f_version_state = 1")
		tx = tx.Where("f_deleted_at is null")
		if err := tx.Model(&model.TaskConfig{}).Count(&total).Error; err != nil {
			return err
		} else if total < 1 {
			// 没有满足条件的记录
			return nil
		}

		if limit > 0 {
			tx = tx.Limit(limit).Offset(offset)
		}

		tx = tx.Order(sort + " " + direction)

		tx = tx.Order("f_id " + direction)

		return tx.Find(&models).Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, total, nil
}

func (r *repo) ListByCatalogSchema(ctx context.Context, catalog, schema string) ([]*model.TaskConfig, int64, error) {
	var models []*model.TaskConfig
	err := r.data.DB.WithContext(ctx).Model(&model.TaskConfig{}).Where("f_ve_catalog = ? and f_schema = ? and f_dv_task_id <> '' and f_deleted_at is null", catalog, schema).Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, int64(len(models)), nil
}

func (r *repo) ListByDvTaskId(ctx context.Context, dvTaskId string, status []int32) ([]*model.TaskConfig, int64, error) {
	var models []*model.TaskConfig
	d := r.data.DB.WithContext(ctx).Model(&model.TaskConfig{}).Where("f_dv_task_id = ?", dvTaskId)
	if len(status) > 0 {
		d = d.Where("f_exec_status in ?", status)
	}
	err := d.Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, int64(len(models)), nil
}

func (r *repo) GetUnfinished(ctx context.Context, execStatus []int32) ([]*model.TaskConfig, error) {
	var models []*model.TaskConfig
	d := r.data.DB.WithContext(ctx).Model(&model.TaskConfig{})
	if len(execStatus) == 1 {
		d = d.Where("f_exec_status = ? ", execStatus[0])
	} else if len(execStatus) > 1 {
		d = d.Where("f_exec_status in ?", execStatus)
	}
	d = d.Where(" f_deleted_at is null").Order("f_created_at asc")
	err := d.Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, nil
}

func (r *repo) GetTaskV2(ctx context.Context, exploreTypes []int32, execStatus []int32) ([]*model.TaskConfig, error) {
	var models []*model.TaskConfig
	d := r.data.DB.WithContext(ctx).
		Model(&model.TaskConfig{})
	if len(exploreTypes) > 0 {
		d = d.Where("f_explore_type in ?", exploreTypes)
	}
	if len(execStatus) > 0 {
		d = d.Where("f_exec_status in ?", execStatus)
	}
	d = d.Where("f_deleted_at is null").
		Order("f_exec_status desc, f_created_at asc")
	err := d.Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, nil
}

func (r *repo) UpdateExecStatusV2(tx *gorm.DB, ctx context.Context, taskId uint64, version int32, execStatus int32) error {
	if err := r.do(tx, ctx).Exec(
		"update t_task_config set f_exec_status=?  where f_task_id=? and f_version=? and f_exec_status < 3",
		execStatus, taskId, version).Error; err != nil {
		return errors.Wrap(err, "Update UpdateExecStatus failed in db")
	}
	return nil
}
