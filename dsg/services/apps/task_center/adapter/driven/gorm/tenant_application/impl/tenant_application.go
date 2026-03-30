package impl

import (
	"context"
	"errors"

	tenant_application "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tenant_application"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

type TenantApplicationRepoImpl struct {
	db *db.Data
}

func NewTenantApplicationRepo(db *db.Data) tenant_application.TenantApplicationRepo {
	return &TenantApplicationRepoImpl{db: db}
}

func (r *TenantApplicationRepoImpl) Create(tx *gorm.DB, ctx context.Context, report *model.TcTenantApp) error {
	return r.do(tx, ctx).Create(report).Error
}

func (r *TenantApplicationRepoImpl) Delete(ctx context.Context, id string) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", id).Updates(&model.TcTenantApp{DeletedAt: 1}).Error
}

func (r *TenantApplicationRepoImpl) GetById(ctx context.Context, id string) (*model.TcTenantApp, error) {
	var report model.TcTenantApp
	result := r.db.DB.WithContext(ctx).Model(&model.TcTenantApp{}).
		Where("id = ? and deleted_at = 0", id).
		First(&report)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, result.Error)
	}

	return &report, nil
}

func (r *TenantApplicationRepoImpl) GetByWorkOrderId(ctx context.Context, id string) (*model.DataResearchReportObject, error) {
	//var report model.DataResearchReportObject
	result := r.db.DB.WithContext(ctx).Model(&model.DataResearchReport{}).
		Select("data_research_report.*, work_order.name as work_order_name, user.name as updated_by_user_name, created_by_user.name as created_by_user_name").
		Joins("LEFT JOIN work_order ON data_research_report.work_order_id = work_order.work_order_id").
		Joins("LEFT JOIN `user` ON data_research_report.updated_by_uid = `user`.id").
		Joins("LEFT JOIN `user` as created_by_user ON data_research_report.created_by_uid = created_by_user.id").
		Where("data_research_report.work_order_id = ?", id)

	models, err := gormx.RawFirst[model.DataResearchReportObject](result)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return &models, nil
}

func (r *TenantApplicationRepoImpl) GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.TcTenantApp, error) {
	tenantApplicationList := make([]*model.TcTenantApp, 0)
	if len(ids) < 1 {
		log.WithContext(ctx).Warn("tenant ids is empty")
		return nil, nil
	}
	result := r.db.DB.WithContext(ctx).Model(&model.TcTenantApp{}).
		Where("tenant_application_id IN (?)", ids).
		Find(&tenantApplicationList)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, result.Error)
	}

	return tenantApplicationList, nil
}

func (r *TenantApplicationRepoImpl) List(ctx context.Context, pMap map[string]any, userId string) (int64, []*model.TcTenantApp, error) {
	//limit := params.Limit
	//offset := params.Offset
	var total int64

	var db *gorm.DB
	db = r.db.DB.WithContext(ctx).Table("tc_tenant_app t").Where("t.deleted_at=0")
	//db = db.Select("t.id as id, t.application_name, t.application_code, t.tenant_name, t.business_unit_id, t.business_unit_contactor_id, t.business_unit_phone, t.status, t.created_at, t.created_by_uid")

	if pMap["business_unit_id"] != nil {
		db = db.Where("business_unit_id in (?)", pMap["business_unit_id"])
	}
	if pMap["status_list"] != nil {
		db = db.Where("status in (?)", pMap["status_list"])
	}

	if pMap["apply_begin_time"] != nil {
		db = db.Where("created_at >= ?", pMap["apply_begin_time"])
	}

	if pMap["apply_end_time"] != nil {
		db = db.Where("created_at <= ?", pMap["apply_end_time"])
	}

	if pMap["keyword"] != nil && pMap["keyword"].(string) != "" {
		db = db.Where("t.application_name LIKE ? OR t.application_code LIKE ? OR t.tenant_name LIKE ?",
			"%"+util.KeywordEscape(util.XssEscape(pMap["keyword"].(string)))+"%",
			"%"+util.KeywordEscape(util.XssEscape(pMap["keyword"].(string)))+"%",
			"%"+util.KeywordEscape(util.XssEscape(pMap["keyword"].(string)))+"%",
		)
	}

	if pMap["only_mine"] != nil {
		db = db.Where("created_by_uid = ?", userId)
	}

	err := db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	models := make([]*model.TcTenantApp, 0)
	if pMap["sort"] != nil && pMap["direction"] != nil {
		db = db.Order(pMap["sort"].(string) + " " + pMap["direction"].(string))
	}
	if pMap["offset"] != nil && pMap["limit"] != nil {
		db = db.Offset((pMap["offset"].(int) - 1) * pMap["limit"].(int)).
			Limit(pMap["limit"].(int))
	}

	db = db.Scan(&models)
	err = db.Error

	if err != nil {
		return 0, models, err
	}

	return total, models, nil
}

func (r *TenantApplicationRepoImpl) Update(tx *gorm.DB, ctx context.Context, tenant *model.TcTenantApp) error {
	err := r.do(tx, ctx).Where("id=?", tenant.ID).Updates(tenant).Error
	if err != nil {
		return err
	}
	// 对允许为空字段处理
	item := map[string]interface{}{
		"maintenance_unit_id":             tenant.MaintenanceUnitID,
		"maintenance_unit_name":           tenant.MaintenanceUnitName,
		"maintenance_unit_contactor_id":   tenant.MaintenanceUnitContactorID,
		"maintenance_unit_contactor_name": tenant.MaintenanceUnitContactorName,
		"maintenance_unit_phone":          tenant.MaintenanceUnitPhone,
		"maintenance_unit_email":          tenant.MaintenanceUnitEmail,
		"business_unit_fax":               tenant.BusinessUnitFax,
	}
	err = r.do(tx, ctx).Model(&model.TcTenantApp{}).Where("id=?", tenant.ID).Updates(item).Error
	return err
}

func (r *TenantApplicationRepoImpl) CheckNameRepeat(ctx context.Context, id, name string) (bool, error) {
	var count int64
	db := r.db.DB.WithContext(ctx).Model(&model.TcTenantApp{}).Where("application_name = ?", name)
	if id != "" {
		db = db.Where("id != ?", id)
	}
	db = db.Where("deleted_at = 0")
	err := db.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *TenantApplicationRepoImpl) GetChangeAudit(ctx context.Context, id string) (*model.DataResearchReportChangeAuditObject, error) {
	//var changeAudit model.DataResearchReportChangeAuditObject
	result := r.db.DB.WithContext(ctx).Model(&model.DataResearchReportChangeAudit{}).
		Select("data_research_report_change_audit.*, work_order.name as work_order_name, user.name as updated_by_user_name, created_by_user.name as created_by_user_name").
		Joins("LEFT JOIN work_order ON data_research_report_change_audit.work_order_id = work_order.work_order_id").
		Joins("LEFT JOIN `user` ON data_research_report_change_audit.updated_by_uid = `user`.id").
		Joins("LEFT JOIN `user` as created_by_user ON data_research_report_change_audit.created_by_uid = created_by_user.id").
		Where("data_research_report_change_audit.id = ?", id)
	models, err := gormx.RawFirst[model.DataResearchReportChangeAuditObject](result)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return &models, nil
}

func (r *TenantApplicationRepoImpl) CreateChangeAudit(ctx context.Context, changeAudit *model.DataResearchReportChangeAudit) error {
	return r.db.DB.WithContext(ctx).Create(changeAudit).Error
}

func (r *TenantApplicationRepoImpl) UpdateChangeAudit(ctx context.Context, changeAudit *model.DataResearchReportChangeAudit) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", changeAudit.ID).Updates(changeAudit).Error
}

func (r *TenantApplicationRepoImpl) DeleteChangeAudit(ctx context.Context, id string) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.DataResearchReportChangeAudit{}).Error
}

func (r *TenantApplicationRepoImpl) CreateDatabaseAccount(ctx context.Context, entity *model.TcTenantAppDbAccount) error {
	return r.db.DB.WithContext(ctx).Create(entity).Error
}
func (r *TenantApplicationRepoImpl) DeleteDatabaseAccount(ctx context.Context, id string) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", id).Updates(&model.TcTenantAppDbAccount{DeletedAt: 1}).Error
}

func (r *TenantApplicationRepoImpl) DeleteDatabaseAccountByTenantApplyId(tx *gorm.DB, ctx context.Context, tenantAppId string) error {
	return r.do(tx, ctx).Where("tenant_application_id = ?", tenantAppId).Updates(&model.TcTenantAppDbAccount{DeletedAt: 1}).Error
}

func (r *TenantApplicationRepoImpl) GetDatabaseAccountById(ctx context.Context, id string) (*model.TcTenantAppDbAccount, error) {
	var report model.TcTenantAppDbAccount
	result := r.db.DB.WithContext(ctx).Model(&model.TcTenantAppDbAccount{}).
		Where("id = ? and deleted_at = 0", id).
		First(&report)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, result.Error)
	}

	return &report, nil
}
func (r *TenantApplicationRepoImpl) GetDatabaseAccountList(ctx context.Context, tenantAppId string) ([]*model.TcTenantAppDbAccount, error) {
	var err error
	models := make([]*model.TcTenantAppDbAccount, 0)

	var db *gorm.DB
	db = r.db.DB.WithContext(ctx).Table("tc_tenant_app_db_account").Where("deleted_at=0")
	db = db.Where("tenant_application_id=?", tenantAppId)

	db = db.Scan(&models)
	err = db.Error

	if err != nil {
		return nil, err
	}

	return models, nil
}
func (r *TenantApplicationRepoImpl) UpdateDatabaseAccount(ctx context.Context, entity *model.TcTenantAppDbAccount) error {
	return r.db.DB.WithContext(ctx).Where("id=?", entity.ID).Updates(entity).Error
}

func (r *TenantApplicationRepoImpl) BatchCreateDatabaseAccount(tx *gorm.DB, ctx context.Context, ms []*model.TcTenantAppDbAccount) error {
	return r.do(tx, ctx).CreateInBatches(ms, len(ms)).Error
}

func (r *TenantApplicationRepoImpl) CreateDataResource(ctx context.Context, entity *model.TcTenantAppDbDataResource) error {
	return r.db.DB.WithContext(ctx).Create(entity).Error
}
func (r *TenantApplicationRepoImpl) DeleteDataResource(ctx context.Context, id string) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", id).Updates(&model.TcTenantAppDbDataResource{DeletedAt: 1}).Error
}

func (r *TenantApplicationRepoImpl) DeleteDataResourceByTenantApplyId(tx *gorm.DB, ctx context.Context, tenantAppId string) error {
	return r.do(tx, ctx).Where("tenant_application_id = ?", tenantAppId).Updates(&model.TcTenantAppDbAccount{DeletedAt: 1}).Error
}

func (r *TenantApplicationRepoImpl) GetDataResourceById(ctx context.Context, id string) (*model.TcTenantAppDbDataResource, error) {
	var report model.TcTenantAppDbDataResource
	result := r.db.DB.WithContext(ctx).Model(&model.TcTenantAppDbDataResource{}).
		Where("id = ? and deleted_at = 0", id).
		First(&report)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, result.Error)
	}

	return &report, nil
}
func (r *TenantApplicationRepoImpl) GetDataResourceList(ctx context.Context, databaseAccountId string) ([]*model.TcTenantAppDbDataResource, error) {
	var err error
	models := make([]*model.TcTenantAppDbDataResource, 0)

	var db *gorm.DB
	db = r.db.DB.WithContext(ctx).Table("tc_tenant_app_db_data_resource").Where("deleted_at=0")
	db = db.Where("database_account_id=?", databaseAccountId)

	db = db.Scan(&models)
	err = db.Error

	if err != nil {
		return nil, err
	}

	return models, nil
}
func (r *TenantApplicationRepoImpl) UpdateDataResource(ctx context.Context, entity *model.TcTenantAppDbDataResource) error {
	return r.db.DB.WithContext(ctx).Where("id=?", entity.ID).Updates(entity).Error
}

func (r *TenantApplicationRepoImpl) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.db.DB.WithContext(ctx)
	}
	return tx
}

func (r *TenantApplicationRepoImpl) BatchCreateDataResource(tx *gorm.DB, ctx context.Context, ms []*model.TcTenantAppDbDataResource) error {
	return r.do(tx, ctx).CreateInBatches(ms, len(ms)).Error
}
