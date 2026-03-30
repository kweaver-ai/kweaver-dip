package impl

import (
	"context"
	"errors"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/system_operation_detail"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type SystemOperationDetailRepoImpl struct {
	db *gorm.DB
}

func NewSystemOperationDetailRepo(db *gorm.DB) system_operation_detail.SystemOperationDetailRepo {
	return &SystemOperationDetailRepoImpl{db: db}
}

func (r *SystemOperationDetailRepoImpl) Create(ctx context.Context, detail *model.TSystemOperationDetail) error {
	return r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Create(detail).Error
}

func (r *SystemOperationDetailRepoImpl) Update(ctx context.Context, detail *model.TSystemOperationDetail) error {
	return r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Where("id = ?", detail.ID).Updates(detail).Error
}

func (r *SystemOperationDetailRepoImpl) UpdateWhiteList(ctx context.Context, detail *model.TSystemOperationDetail) error {
	return r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Select("quality_check", "data_update").Where("id = ?", detail.ID).Updates(detail).Error
}

func (r *SystemOperationDetailRepoImpl) GetByFormViewID(ctx context.Context, formViewId string) (*model.TSystemOperationDetail, error) {
	var detail *model.TSystemOperationDetail
	err := r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Where("form_view_id = ?", formViewId).First(&detail).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.WhiteListNotExist)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return detail, nil
}

func (r *SystemOperationDetailRepoImpl) QueryList(ctx context.Context, page *request.BOPageInfo, keyword string, departmentIds, infoSystemIds []string, acceptanceStart, acceptanceEnd *time.Time, isWhitelisted *bool) ([]*model.TSystemOperationDetail, int64, error) {
	var totalCount int64
	var datas []*model.TSystemOperationDetail
	d := r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{})

	if len(departmentIds) > 0 {
		d = d.Where("department_id in ?", departmentIds)
	}

	if len(infoSystemIds) > 0 {
		d = d.Where("info_system_id in ?", infoSystemIds)
	}
	if keyword != "" {
		kw := "%" + util.KeywordEscape(keyword) + "%"
		d = d.Where("`technical_name` LIKE ? or business_name LIKE ? ", kw, kw)
	}
	if acceptanceStart != nil && acceptanceEnd != nil {
		d = d.Where("acceptance_time >= ? and acceptance_time <= ?", acceptanceStart, acceptanceEnd)
	}
	if isWhitelisted != nil {
		if *isWhitelisted {
			d = d.Where("quality_check > 0 or quality_check > 0")
		} else {
			d = d.Where("quality_check = 0 and quality_check = 0")
		}
	}
	err := d.Count(&totalCount).Error
	if err == nil {
		d = d.Order(*(page.Sort) + " " + *(page.Direction))
		if *page.Limit > 0 {
			d = d.Offset((*(page.Offset) - 1) * *(page.Limit)).Limit(*(page.Limit))
		}
		err = d.Scan(&datas).Error
	}
	return datas, totalCount, err
}

func (r *SystemOperationDetailRepoImpl) QueryInfoSystemList(ctx context.Context, page *request.BOPageInfo, infoSystemIds []string, acceptanceStart, acceptanceEnd *time.Time) (map[string]int, int64, error) {
	// 获取总数用于分页
	var totalCount int64
	type GroupResult struct {
		InfoSystemID string
		Count        int
	}
	var results []GroupResult
	infoSystemMap := make(map[string]int)
	d := r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{})
	d = d.Select("info_system_id, COUNT(*) as count").
		Where("info_system_id IS NOT NULL AND info_system_id != ''")
	if acceptanceStart != nil && acceptanceEnd != nil {
		d = d.Where("acceptance_time >= ? and acceptance_time <= ?", acceptanceStart, acceptanceEnd)
	}
	if len(infoSystemIds) > 0 {
		d = d.Where("info_system_id in ?", infoSystemIds)
	}
	d = d.Group("info_system_id").Order("info_system_id")
	err := d.Count(&totalCount).Error
	if err == nil {
		d = d.Order(*(page.Sort) + " " + *(page.Direction))
		if *page.Limit > 0 {
			d = d.Offset((*(page.Offset) - 1) * *(page.Limit)).Limit(*(page.Limit))
		}
		err = d.Scan(&results).Error
		if err == nil {
			for _, result := range results {
				infoSystemMap[result.InfoSystemID] = result.Count
			}
		}
	}
	return infoSystemMap, totalCount, err
}

func (r *SystemOperationDetailRepoImpl) GetByInfoSystemID(ctx context.Context, infoSystemId string) ([]*model.TSystemOperationDetail, error) {
	var details []*model.TSystemOperationDetail
	err := r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Where("info_system_id = ?", infoSystemId).Find(&details).Error
	return details, err
}

func (r *SystemOperationDetailRepoImpl) GetByFormViewIDs(ctx context.Context, formViewIds []string) ([]*model.TSystemOperationDetail, error) {
	var details []*model.TSystemOperationDetail
	err := r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Where("form_view_id in ?", formViewIds).Find(&details).Error
	return details, err
}

func (r *SystemOperationDetailRepoImpl) GetFormViewIDs(ctx context.Context) ([]string, error) {
	var formViewIds []string
	err := r.db.WithContext(ctx).Model(&model.TSystemOperationDetail{}).Select("form_view_id").Find(&formViewIds).Error
	return formViewIds, err
}

func (r *SystemOperationDetailRepoImpl) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.TSystemOperationDetail{}).Error
}
