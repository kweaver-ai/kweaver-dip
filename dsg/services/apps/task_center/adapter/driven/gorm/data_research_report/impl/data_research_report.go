package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	data_research_report "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

type DataResearchReportRepoImpl struct {
	db *db.Data
}

func NewDataResearchReportRepo(db *db.Data) data_research_report.DataResearchReportRepo {
	return &DataResearchReportRepoImpl{db: db}
}

func (r *DataResearchReportRepoImpl) Create(ctx context.Context, report *model.DataResearchReport) error {
	return r.db.DB.WithContext(ctx).Create(report).Error
}

func (r *DataResearchReportRepoImpl) Delete(ctx context.Context, id string) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.DataResearchReport{}).Error
}

func (r *DataResearchReportRepoImpl) GetById(ctx context.Context, id string) (*model.DataResearchReportObject, error) {
	//var report model.DataResearchReportObject
	result := r.db.DB.WithContext(ctx).Model(&model.DataResearchReport{}).
		Select("data_research_report.*, work_order.name as work_order_name, user.name as updated_by_user_name, created_by_user.name as created_by_user_name").
		Joins("LEFT JOIN work_order ON data_research_report.work_order_id = work_order.work_order_id").
		Joins("LEFT JOIN `user` ON data_research_report.updated_by_uid = `user`.id").
		Joins("LEFT JOIN `user` as created_by_user ON data_research_report.created_by_uid = created_by_user.id").
		Where("data_research_report.id = ?", id)
	models, err := gormx.RawFirst[model.DataResearchReportObject](result)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return &models, nil
}

func (r *DataResearchReportRepoImpl) GetByWorkOrderId(ctx context.Context, id string) (*model.DataResearchReportObject, error) {
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

func (r *DataResearchReportRepoImpl) GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataResearchReport, error) {
	researchReportList := make([]*model.DataResearchReport, 0)
	if len(ids) < 1 {
		log.WithContext(ctx).Warn("plan ids is empty")
		return nil, nil
	}
	result := r.db.DB.WithContext(ctx).Model(&model.DataResearchReport{}).
		Where("data_research_report_id IN (?)", ids).
		Find(&researchReportList)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ReportIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, result.Error)
	}

	return researchReportList, nil
}

func (r *DataResearchReportRepoImpl) List(ctx context.Context, params *domain.ResearchReportQueryParam) (int64, []*model.DataResearchReportObject, error) {
	limit := params.Limit
	offset := params.Offset
	var total int64

	db := r.db.DB.WithContext(ctx).Model(&model.DataResearchReport{}).
		Select("data_research_report.*, work_order.name as work_order_name, `user`.name as updated_by_user_name").
		Joins("LEFT JOIN work_order ON data_research_report.work_order_id = work_order.work_order_id").
		Joins("LEFT JOIN `user` ON data_research_report.updated_by_uid = `user`.id")

	if params.Keyword != "" {
		db = db.Where("work_order.name LIKE ? OR data_research_report.name LIKE ?",
			"%"+util.KeywordEscape(util.XssEscape(params.Keyword))+"%",
			"%"+util.KeywordEscape(util.XssEscape(params.Keyword))+"%",
		)
	}

	if params.StartedAt > 0 {
		if strings.Contains(gormx.DriveDm, r.db.DB.Dialector.Name()) {
			db = db.Where("data_research_report.updated_at >= DATEADD(S, ?, TIMESTAMP '1970-01-01 00:00:00')", params.StartedAt)
		} else {
			db = db.Where("data_research_report.updated_at >= FROM_UNIXTIME(?)", params.StartedAt)
		}
	}

	if params.FinishedAt > 0 {
		if strings.Contains(gormx.DriveDm, r.db.DB.Dialector.Name()) {
			db = db.Where("data_research_report.updated_at <= DATEADD(S, ?, TIMESTAMP '1970-01-01 00:00:00')", params.FinishedAt)
		} else {
			db = db.Where("data_research_report.updated_at <= FROM_UNIXTIME(?)", params.FinishedAt)
		}
	}

	if params.WorkOrderID != "" {
		db = db.Where("data_research_report.work_order_id = ?", params.WorkOrderID)
	}

	total, err := gormx.RawCount(db)
	if err != nil {
		return 0, nil, err
	}

	//models := make([]*model.DataResearchReportObject, 0)
	db = db.Limit(int(limit)).Offset((int(offset) - 1) * int(limit))
	db = db.Order(fmt.Sprintf("data_research_report.%s %s, data_research_report.data_research_report_id asc", params.Sort, params.Direction))
	models, errModel := gormx.RawScan[*model.DataResearchReportObject](db)
	if errModel != nil {
		return 0, models, errModel
	}

	return total, models, nil
}

func (r *DataResearchReportRepoImpl) Update(ctx context.Context, report *model.DataResearchReport) error {
	return r.db.DB.WithContext(ctx).Where("id=?", report.ID).Updates(report).Error
}

func (r *DataResearchReportRepoImpl) UpdateRejectReason(ctx context.Context, reportID string, rejectReason string) error {
	return r.db.DB.Debug().WithContext(ctx).Model(&model.DataResearchReport{}).Where("id=?", reportID).Update("reject_reason", rejectReason).Error
}

func (r *DataResearchReportRepoImpl) UpdateFields(ctx context.Context, reportID string, fields map[string]interface{}) error {
	return r.db.DB.Debug().WithContext(ctx).Model(&model.DataResearchReport{}).Where("id = ?", reportID).Updates(fields).Error
}

func (r *DataResearchReportRepoImpl) CheckNameRepeat(ctx context.Context, id, name string) (bool, error) {
	var count int64
	db := r.db.DB.WithContext(ctx).Model(&model.DataResearchReport{}).Where("name = ?", name)
	if id != "" {
		db = db.Where("id != ?", id)
	}
	err := db.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *DataResearchReportRepoImpl) GetChangeAudit(ctx context.Context, id string) (*model.DataResearchReportChangeAuditObject, error) {
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

func (r *DataResearchReportRepoImpl) CreateChangeAudit(ctx context.Context, changeAudit *model.DataResearchReportChangeAudit) error {
	return r.db.DB.WithContext(ctx).Create(changeAudit).Error
}

func (r *DataResearchReportRepoImpl) UpdateChangeAudit(ctx context.Context, changeAudit *model.DataResearchReportChangeAudit) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", changeAudit.ID).Updates(changeAudit).Error
}

func (r *DataResearchReportRepoImpl) DeleteChangeAudit(ctx context.Context, id string) error {
	return r.db.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.DataResearchReportChangeAudit{}).Error
}
