package report

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"

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
	Create(tx *gorm.DB, ctx context.Context, m *model.Report) error
	Update(tx *gorm.DB, ctx context.Context, m *model.Report) error
	Get(tx *gorm.DB, ctx context.Context, fid uint64) (*model.Report, error)
	GetList(tx *gorm.DB, ctx context.Context, tableId string) ([]*model.Report, error)
	GetListByTaskIdWithOutLatest(tx *gorm.DB, ctx context.Context, taskId uint64) ([]*model.Report, error)
	GetUnfinishedByTaskId(tx *gorm.DB, ctx context.Context, task_id uint64) (*model.Report, error)
	Delete(tx *gorm.DB, ctx context.Context, fid uint64) (bool, error)
	GetByCode(tx *gorm.DB, ctx context.Context, code string) (*model.Report, error)
	UpdateLatestState(tx *gorm.DB, ctx context.Context, taskId uint64) error
	GetRecentSuccessReportByParams(tx *gorm.DB, ctx context.Context, taskId *string, tableId *string) (*model.Report, error)
	ListByPage(ctx context.Context, page *request.PageInfo, tableId *string, taskId *string) ([]*model.Report, int64, error)
	SelectOverTimeReport(tx *gorm.DB, ctx context.Context, stepTime *time.Time) ([]*model.Report, error)
	GetByDvTaskIdAndTable(tx *gorm.DB, ctx context.Context, dvTaskId, tableName string) (*model.Report, error)
	ListByCatalogSchema(ctx context.Context, catalog, schema string) ([]*model.Report, int64, error)
	ListByDvTaskId(ctx context.Context, dvTaskId string) ([]*model.Report, int64, error)
	ListByTableIds(ctx context.Context, tableIds []string) ([]*model.Report, int64, error)
	GetByTaskIdAndVersion(tx *gorm.DB, ctx context.Context, taskId uint64, version *int32) (*model.Report, error)
	GetReports(ctx context.Context, Offset, limit *int, direction, sort *string, tableIds []string) ([]*model.Report, int64, error)
	QueryList(ctx context.Context, page *request.PageInfo, catalogName, keyword string) ([]*model.Report, int64, error)

	GetReportV2(ctx context.Context, exploreTypes []int32, execStatus []int32) ([]*model.Report, error)
	UpdateLatestStateV2(tx *gorm.DB, ctx context.Context, taskId uint64, taskVersion int32) error
	UpdateFinished(tx *gorm.DB, ctx context.Context, m *model.Report) error
	UpdateExecStatus(tx *gorm.DB, ctx context.Context, taskId uint64, version int32, execStatus int32) error
	GetByTaskIdAndVersionV2(tx *gorm.DB, ctx context.Context, taskId uint64, version *int32) (*model.Report, error)
	GetLatestState(tx *gorm.DB, ctx context.Context, taskId uint64, version int32) (int32, error)
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

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.Report) error {
	if err := r.do(tx, ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return errors.Wrap(err, "CreateJob failed in db")
	}

	return nil
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.Report) error {
	tx = r.do(tx, ctx).Model(&model.Report{ID: m.ID}).Updates(m)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		if mariadb.Is(tx.Error, mariadb.ER_DUP_ENTRY) {
			return nil
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}
	return nil
}

func (r *repo) UpdateLatestState(tx *gorm.DB, ctx context.Context, taskId uint64) error {
	if err := r.do(tx, ctx).Exec(
		"update t_report set f_latest=0 where f_task_id=?",
		taskId).Error; err != nil {
		return errors.Wrap(err, "Update UpdateLatestState failed in db")
	}
	return nil
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, fid uint64) (*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Raw(
		"select * from t_report where f_id=? limit 1",
		fid).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get by id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, tableId string) ([]*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Raw(
		"select * from t_report where f_table_id=?",
		tableId).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetList by tableId failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) SelectOverTimeReport(tx *gorm.DB, ctx context.Context, stepTime *time.Time) ([]*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Raw(
		"select * from t_report where f_finished_at is null and f_created_at <= ?",
		stepTime).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "SelectOverTimeReport failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) GetListByTaskIdWithOutLatest(tx *gorm.DB, ctx context.Context, taskId uint64) ([]*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Raw(
		"select * from t_report where f_task_id=? and f_latest = 0 and f_finished_at is not null",
		taskId).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetListByTaskId by taskId failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) GetUnfinishedByTaskId(tx *gorm.DB, ctx context.Context, task_id uint64) (*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Raw(
		"select * from t_report where f_task_id=? and f_finished_at is null limit 1",
		task_id).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get by id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetRecentSuccessReportByParams(tx *gorm.DB, ctx context.Context, taskId *string, tableId *string) (*model.Report, error) {
	do := r.do(tx, ctx)
	var models []*model.Report
	if tableId != nil {
		do = do.Where("f_table_id = ?", tableId)
	}
	if taskId != nil {
		do = do.Where("f_task_id = ?", taskId)
	}
	do = do.Where("f_status = 3 and f_deleted_at is null")
	do = do.Order("f_created_at DESC")

	if err := do.Find(&models).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, err)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(models) > 0 {
		return models[0], nil
	}
	return nil, nil
}

func (r *repo) GetByCode(tx *gorm.DB, ctx context.Context, code string) (*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Raw(
		"select * from t_report where f_code=? and f_deleted_at is null limit 1",
		code).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get GetByCode id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) Delete(tx *gorm.DB, ctx context.Context, fid uint64) (bool, error) {
	do := r.do(tx, ctx)
	tx = do.Model(&model.Report{}).Delete(&model.Report{}, fid)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}

	return tx.RowsAffected > 0, nil
}

func (r *repo) ListByPage(ctx context.Context, page *request.PageInfo, tableId *string, taskId *string) ([]*model.Report, int64, error) {
	var total int64
	var models []*model.Report
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
		if taskId != nil && len(*taskId) > 0 {
			tx = tx.Where("f_task_id = ?", taskId)
		}
		tx = tx.Where("f_status = 3 and f_deleted_at is null")
		if err := tx.Model(&model.Report{}).Count(&total).Error; err != nil {
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

func (r *repo) GetByDvTaskIdAndTable(tx *gorm.DB, ctx context.Context, dvTaskId, tableName string) (*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Model(&model.Report{}).Where("f_dv_task_id=? and f_table = ? and f_deleted_at is null", dvTaskId, tableName).Take(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get by id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) ListByCatalogSchema(ctx context.Context, catalog, schema string) ([]*model.Report, int64, error) {
	var models []*model.Report
	err := r.data.DB.WithContext(ctx).Model(&model.Report{}).Where("f_ve_catalog = ? and f_schema = ? and f_dv_task_id <> '' and f_status = 3 and f_latest = 1", catalog, schema).Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, int64(len(models)), nil
}

func (r *repo) ListByDvTaskId(ctx context.Context, dvTaskId string) ([]*model.Report, int64, error) {
	var models []*model.Report
	err := r.data.DB.WithContext(ctx).Model(&model.Report{}).Where("f_dv_task_id = ? and f_deleted_at is null", dvTaskId).Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, int64(len(models)), nil
}

func (r *repo) ListByTableIds(ctx context.Context, tableIds []string) ([]*model.Report, int64, error) {
	var models []*model.Report
	err := r.data.DB.WithContext(ctx).Model(&model.Report{}).Where("f_table_id in ? and f_status = 3 and f_latest = 1", tableIds).Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, int64(len(models)), nil
}

func (r *repo) GetByTaskIdAndVersion(tx *gorm.DB, ctx context.Context, taskId uint64, version *int32) (*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Model(&model.Report{}).Where("f_task_id=? and f_task_version = ? and f_deleted_at is null", taskId, version).Take(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get by id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetByTaskIdAndVersionV2(tx *gorm.DB, ctx context.Context, taskId uint64, version *int32) (*model.Report, error) {
	var ms []*model.Report
	if err := r.do(tx, ctx).Model(&model.Report{}).Where("f_task_id=? and f_task_version = ? and f_deleted_at is null", taskId, version).Find(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get by id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetReports(ctx context.Context, offset, limit *int, direction, sort *string, tableIds []string) ([]*model.Report, int64, error) {
	var total int64
	var models []*model.Report
	Db := r.data.DB.WithContext(ctx).Model(&model.Report{}).Where("f_status = 3 and f_latest = 1 and f_explore_type = 1")
	if len(tableIds) > 0 {
		Db = Db.Where("f_table_id in ?", tableIds)
	}

	err := Db.Count(&total).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if limit != nil && offset != nil && *limit > 0 {
		Db = Db.Limit(*limit).Offset(*limit * (*offset - 1))
	}
	if sort != nil && direction != nil {
		Db = Db.Order(*sort + " " + *direction)
	}
	err = Db.Find(&models).Error
	return models, total, nil
}

func (r *repo) QueryList(ctx context.Context, page *request.PageInfo, catalogName string, keyword string) ([]*model.Report, int64, error) {
	var total int64
	var models []*model.Report
	var offset = *page.Offset
	var limit = *page.Limit
	var sort = *page.Sort
	var direction = *page.Direction

	offset = limit * (offset - 1)

	if err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)
		if catalogName != "" {
			tx = tx.Where("f_ve_catalog = ?", catalogName)
		}
		if keyword != "" {
			keyword = "%" + util.KeywordEscape(keyword) + "%"
			tx = tx.Where("f_table like ?", keyword)
		}
		tx = tx.Where("f_explore_type =1 and f_status = 3 and f_latest = 1")
		if err := tx.Model(&model.Report{}).Count(&total).Error; err != nil {
			return err
		} else if total < 1 {
			// 没有满足条件的记录
			return nil
		}

		if limit > 0 {
			tx = tx.Limit(limit).Offset(offset)
		}
		if sort == "f_updated_at" {
			tx = tx.Order("f_finished_at " + direction)
		} else {
			tx = tx.Order(sort + " " + direction)
		}

		return tx.Find(&models).Error
	}); err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, total, nil
}

func (r *repo) GetReportV2(ctx context.Context, exploreTypes []int32, execStatus []int32) ([]*model.Report, error) {
	var models []*model.Report
	d := r.data.DB.WithContext(ctx).Model(&model.Report{})
	if len(exploreTypes) > 0 {
		d = d.Where("f_explore_type in ?", exploreTypes)
	}
	if len(execStatus) > 0 {
		d = d.Where("f_status in ?", execStatus)
	}
	d = d.Where("f_deleted_at is null").
		Order("f_status desc, f_created_at asc").
		Find(&models)
	return models, d.Error
}

func (r *repo) UpdateLatestStateV2(tx *gorm.DB, ctx context.Context, taskId uint64, taskVersion int32) error {
	if err := r.do(tx, ctx).Exec(
		"update t_report set f_latest=0 where f_task_id=? and f_task_version < ?",
		taskId, taskVersion).Error; err != nil {
		return errors.Wrap(err, "Update UpdateLatestStateV2 failed in db")
	}
	return nil
}

func (r *repo) UpdateFinished(tx *gorm.DB, ctx context.Context, m *model.Report) error {
	switch *m.Status {
	case 3:
		if err := r.do(tx, ctx).Exec(
			`UPDATE t_report 
				SET f_latest = (SELECT case when COUNT(1) = 0 then 1 ELSE 0 end  
									FROM t_report 
									WHERE f_task_id = ? AND f_task_version > ? AND f_latest = 1),
					f_result = ?,
					f_finished_at = ?, 
					f_status = ?,
					f_total_score = ?,
					f_total_completeness = ?,
					f_total_standardization = ?,
					f_total_uniqueness = ?,
					f_total_accuracy = ?,
					f_total_consistency = ? 
				WHERE f_task_id = ? AND f_task_version = ? AND f_status < 3`,
			m.TaskID, m.TaskVersion, m.Result, m.FinishedAt, m.Status, m.TotalScore,
			m.TotalCompleteness, m.TotalStandardization, m.TotalUniqueness, m.TotalAccuracy, m.TotalConsistency,
			m.TaskID, m.TaskVersion).Error; err != nil {
			return errors.Wrap(err, "Update UpdateFinished failed in db")
		}
	case 4, 5:
		if err := r.do(tx, ctx).Model(&model.Report{}).Where("f_id = ? and f_status < 3", m.ID).Updates(m).Error; err != nil {
			return errors.Wrap(err, "Update UpdateFinished failed in db")
		}
	}

	return nil
}

func (r *repo) UpdateExecStatus(tx *gorm.DB, ctx context.Context, taskId uint64, version int32, execStatus int32) error {
	return r.do(tx, ctx).
		Model(&model.Report{}).
		Where("f_task_id = ? and f_task_version = ? and f_status <= ?", taskId, version, execStatus).
		UpdateColumn("f_status", execStatus).Error
}

func (r *repo) GetLatestState(tx *gorm.DB, ctx context.Context, taskId uint64, version int32) (int32, error) {
	var latestState int32
	err := r.do(tx, ctx).
		Raw(`SELECT case when COUNT(1) = 0 then 1 ELSE 0 end  
				FROM t_report 
				WHERE f_task_id = ? AND f_task_version > ? AND f_latest = 1`, taskId, version).
		Scan(&latestState).Error
	return latestState, err
}
