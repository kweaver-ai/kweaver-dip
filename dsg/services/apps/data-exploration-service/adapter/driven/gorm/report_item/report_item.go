package report_item

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode/mariadb"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

type Repo interface {
	BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.ReportItem) error
	Create(tx *gorm.DB, ctx context.Context, m *model.ReportItem) error
	Update(tx *gorm.DB, ctx context.Context, m *model.ReportItem) error
	BatchUpdate(tx *gorm.DB, ctx context.Context, m []*model.ReportItem) error
	Get(tx *gorm.DB, ctx context.Context, fid uint64) (*model.ReportItem, error)
	GetByCode(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error)
	GetByCodeAndProject(tx *gorm.DB, ctx context.Context, reportCode, project, column string) (*model.ReportItem, error)
	GetByProjectCode(tx *gorm.DB, ctx context.Context, projectCode string, reportCode string, columnName *string, params *string) (*model.ReportItem, error)
	GetListByCode(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error)
	GetByVeTaskId(tx *gorm.DB, ctx context.Context, veTaskId string) ([]*model.ReportItem, error)
	GetItemByVeTaskId(tx *gorm.DB, ctx context.Context, veTaskId string) (*model.ReportItem, error)
	GetUnfinishedListByCode(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error)
	GetListByColumn(tx *gorm.DB, ctx context.Context, columnName string, reportCode string) ([]*model.ReportItem, error)
	DeleteByTaskWithOutCurrentReport(tx *gorm.DB, ctx context.Context, reportCodes []string) error

	GetByCodeV2(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error)
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

func (r *repo) BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.ReportItem) error {
	if err := r.do(tx, ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.CreateInBatches(m, 1000).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return errors.Wrap(err, "Create failed in db")
	}

	return nil
}

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.ReportItem) error {
	if err := r.do(tx, ctx).Create(m).Error; err != nil {
		return errors.Wrap(err, "Create failed in db")
	}

	return nil
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.ReportItem) error {
	tx = r.do(tx, ctx).Model(&model.ReportItem{ID: m.ID}).Updates(m)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		if mariadb.Is(tx.Error, mariadb.ER_DUP_ENTRY) {
			return nil
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}
	return nil
}

func (r *repo) BatchUpdate(tx *gorm.DB, ctx context.Context, m []*model.ReportItem) error {
	tx = r.do(tx, ctx).Model(&model.ReportItem{}).Save(m)
	if tx.Error != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", tx.Error)
		if mariadb.Is(tx.Error, mariadb.ER_DUP_ENTRY) {
			return nil
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, tx.Error)
	}
	return nil
}

func (r *repo) Get(tx *gorm.DB, ctx context.Context, fid uint64) (*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_id=? limit 1",
		fid).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "Getby id failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetByCode(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_code=? and f_status = ?",
		reportCode, constant.Explore_Status_Excuting).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetByCode failed from db")
	}
	return ms, nil
}

func (r *repo) GetByCodeV2(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_code=?",
		reportCode).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetByCode failed from db")
	}
	return ms, nil
}

func (r *repo) GetByCodeAndProject(tx *gorm.DB, ctx context.Context, reportCode, project, column string) (*model.ReportItem, error) {
	var ms []*model.ReportItem
	var err error
	if column != "" {
		err = r.do(tx, ctx).Raw("select * from t_report_item where f_code=? and f_project = ? and f_column = ? limit 1", reportCode, project, column).Scan(&ms).Error
	} else {
		err = r.do(tx, ctx).Raw("select * from t_report_item where f_code=? and f_project = ? and f_column is null limit 1", reportCode, project).Scan(&ms).Error
	}

	if err != nil {
		return nil, errors.Wrap(err, "GetByCode failed from db")
	}

	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetByProjectCode(tx *gorm.DB, ctx context.Context, projectCode string, reportCode string, columnName *string, params *string) (*model.ReportItem, error) {
	do := r.do(tx, ctx)
	var model *model.ReportItem
	if columnName != nil {
		do = do.Where("f_column = ?", columnName)
	}
	do = do.Where("f_code = ?", reportCode)
	do = do.Where("f_project = ?", projectCode)
	if params != nil {
		do = do.Where("f_params =?", params)
	}
	if err := do.First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, err)
		}
		log.WithContext(ctx).Errorf("GetByProjectCode data find failed, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if model != nil {
		return model, nil
	}
	return nil, nil
}

func (r *repo) GetByVeTaskId(tx *gorm.DB, ctx context.Context, veTaskId string) ([]*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_ve_task_id=?",
		veTaskId).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetByCode failed from db")
	}
	return ms, nil
}

func (r *repo) GetItemByVeTaskId(tx *gorm.DB, ctx context.Context, veTaskId string) (*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_ve_task_id=? limit 1",
		veTaskId).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetByCode failed from db")
	}
	if len(ms) > 0 {
		return ms[0], nil
	}
	return nil, nil
}

func (r *repo) GetListByCode(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_code=?",
		reportCode).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetListByCode failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) GetListByColumn(tx *gorm.DB, ctx context.Context, columnName string, reportCode string) ([]*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_code=? and f_column = ?",
		reportCode, columnName).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetListByCode failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) GetUnfinishedListByCode(tx *gorm.DB, ctx context.Context, reportCode string) ([]*model.ReportItem, error) {
	var ms []*model.ReportItem
	if err := r.do(tx, ctx).Raw(
		"select * from t_report_item where f_code=? and f_finished_at is null",
		reportCode).Scan(&ms).Error; err != nil {
		return nil, errors.Wrap(err, "GetUnfinishedListByCode failed from db")
	}

	if len(ms) > 0 {
		return ms, nil
	}
	return nil, nil
}

func (r *repo) DeleteByTaskWithOutCurrentReport(tx *gorm.DB, ctx context.Context, reportCodes []string) error {
	if err := r.do(tx, ctx).Exec(
		"delete from t_report_item where f_code in (?)",
		reportCodes).Error; err != nil {
		return errors.Wrap(err, "DeleteByTaskWithOutCurrentReport failed in db")
	}
	return nil
}
