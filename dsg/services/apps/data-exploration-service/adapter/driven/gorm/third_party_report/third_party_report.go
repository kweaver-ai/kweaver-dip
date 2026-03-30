package third_party_report

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

type Repo interface {
	GetLatestByTableId(tx *gorm.DB, ctx context.Context, tableId string) (*model.ThirdPartyReport, error)
	Create(tx *gorm.DB, ctx context.Context, m *model.ThirdPartyReport) error
	Update(tx *gorm.DB, ctx context.Context, m *model.ThirdPartyReport) error
	ListByPage(ctx context.Context, page *request.PageInfo, tableId *string, taskId *string) ([]*model.ThirdPartyReport, int64, error)
	GetByWorkOrderId(ctx context.Context, workOrderId string) (*model.ThirdPartyReport, error)
	GetByWorkOrderIdAndCode(ctx context.Context, workOrderId, code string) (*model.ThirdPartyReport, error)
	ListByTableIds(ctx context.Context, tableIds []string) ([]*model.ThirdPartyReport, int64, error)
	GetRecentSuccessReportByParams(tx *gorm.DB, ctx context.Context, taskId *string, tableId *string) (*model.ThirdPartyReport, error)
	GetByTableIdAndVersion(tx *gorm.DB, ctx context.Context, tableId uint64, version *int32) (*model.ThirdPartyReport, error)
	QueryList(ctx context.Context, page *request.PageInfo, catalogName, keyword string) ([]*model.ThirdPartyReport, int64, error)
	UpdateLatestState(tx *gorm.DB, ctx context.Context, taskId uint64) error
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

func (r *repo) GetLatestByTableId(tx *gorm.DB, ctx context.Context, tableId string) (*model.ThirdPartyReport, error) {
	var ms []*model.ThirdPartyReport
	if err := r.do(tx, ctx).Model(&model.ThirdPartyReport{}).Where(
		"f_table_id= ?", tableId).Order("f_created_at DESC").Limit(1).Find(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetLatestByTableId id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.ThirdPartyReport) error {
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

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.ThirdPartyReport) error {
	tx = r.do(tx, ctx).Model(&model.ThirdPartyReport{ID: m.ID}).Updates(m)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		if mariadb.Is(tx.Error, mariadb.ER_DUP_ENTRY) {
			return nil
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}
	return nil
}

func (r *repo) ListByPage(ctx context.Context, page *request.PageInfo, tableId *string, taskId *string) ([]*model.ThirdPartyReport, int64, error) {
	var total int64
	var models []*model.ThirdPartyReport
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
		tx = tx.Where("f_status = 3")
		if err := tx.Model(&model.ThirdPartyReport{}).Count(&total).Error; err != nil {
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

func (r *repo) GetByWorkOrderId(ctx context.Context, workOrderId string) (*model.ThirdPartyReport, error) {
	var models []*model.ThirdPartyReport
	err := r.data.DB.WithContext(ctx).Model(&model.ThirdPartyReport{}).Where("f_work_order_id = ?", workOrderId).Order("f_created_at DESC").Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(models) > 0 {
		return models[0], nil
	}
	return nil, nil
}

func (r *repo) GetByWorkOrderIdAndCode(ctx context.Context, workOrderId, code string) (*model.ThirdPartyReport, error) {
	var models []*model.ThirdPartyReport
	err := r.data.DB.WithContext(ctx).Model(&model.ThirdPartyReport{}).Where("f_work_order_id = ? and f_code = ?", workOrderId, code).Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(models) > 0 {
		return models[0], nil
	}
	return nil, nil
}

func (r *repo) ListByTableIds(ctx context.Context, tableIds []string) ([]*model.ThirdPartyReport, int64, error) {
	var models []*model.ThirdPartyReport
	err := r.data.DB.WithContext(ctx).Model(&model.ThirdPartyReport{}).Where("f_table_id in ? and f_status = 3 and f_latest = 1", tableIds).Find(&models).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return models, int64(len(models)), nil
}

func (r *repo) GetRecentSuccessReportByParams(tx *gorm.DB, ctx context.Context, taskId *string, tableId *string) (*model.ThirdPartyReport, error) {
	do := r.do(tx, ctx)
	var models []*model.ThirdPartyReport
	if tableId != nil {
		do = do.Where("f_table_id = ?", tableId)
	}
	if taskId != nil {
		do = do.Where("f_task_id = ?", taskId)
	}
	do = do.Where("f_status = 3")
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

func (r *repo) GetByTableIdAndVersion(tx *gorm.DB, ctx context.Context, tableId uint64, version *int32) (*model.ThirdPartyReport, error) {
	var ms []*model.ThirdPartyReport
	if err := r.do(tx, ctx).Model(&model.ThirdPartyReport{}).Where("f_table_id=? and f_task_version = ?", tableId, version).Take(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Get by id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) QueryList(ctx context.Context, page *request.PageInfo, catalogName string, keyword string) ([]*model.ThirdPartyReport, int64, error) {
	var total int64
	var models []*model.ThirdPartyReport
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
		if err := tx.Model(&model.ThirdPartyReport{}).Count(&total).Error; err != nil {
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

func (r *repo) UpdateLatestState(tx *gorm.DB, ctx context.Context, taskId uint64) error {
	if err := r.do(tx, ctx).Exec(
		"update t_third_party_report set f_latest=0 where f_task_id=?",
		taskId).Error; err != nil {
		return errors.Wrap(err, "Update UpdateLatestState failed in db")
	}
	return nil
}
