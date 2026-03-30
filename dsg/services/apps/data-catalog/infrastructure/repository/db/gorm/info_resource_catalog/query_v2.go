package info_resource_catalog

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/samber/lo"
)

func (repo *infoResourceCatalogRepo) ListUnCatalogedBusinessFormsByV2(ctx context.Context,
	req *info_resource_catalog.QueryUncatalogedBusinessFormsReq) (total int64, records []*model.TBusinessFormNotCataloged, err error) {
	db := repo.db.WithContext(ctx).Model(new(model.TBusinessFormNotCataloged))
	if req.DepartmentID != nil {
		db = db.Where("f_department_id in ?", req.DepartmentIDSlice)
	}
	if req.InfoSystemID != nil {
		infoSystemID := *req.InfoSystemID
		if infoSystemID == "" {
			db = db.Where("f_info_system_id = ''  or f_info_system_id is null ")
		} else {
			db = db.Where("position(? in f_info_system_id)>0", req.InfoSystemID)
		}
	}
	if req.NodeID != nil {
		db = db.Where("f_business_domain_id in ?", req.ChildNodeSlice)
	}
	if req.Keyword != "" {
		db = db.Where("f_name LIKE ?", "%"+req.Keyword+"%")
	}
	//总数
	if err = db.Count(&total).Error; err != nil {
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//分页
	sortFields := lo.Times(len(req.SortBy.Fields), func(index int) string {
		return fmt.Sprintf("f_%v", req.SortBy.Fields[index])
	})
	sortStr := strings.Join(sortFields, ",")
	db = db.Order(sortStr + " " + *req.SortBy.Direction)
	db = db.Limit(*req.Limit).Offset(*req.Limit * (*req.PageNumber - 1))
	err = db.Find(&records).Error
	if err != nil {
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return total, records, nil
}

func (repo *infoResourceCatalogRepo) DeleteForms(ctx context.Context, formSliceID []string) error {
	err := repo.db.WithContext(ctx).Where("f_id in ? ", formSliceID).Delete(&model.TBusinessFormNotCataloged{}).Error
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (repo *infoResourceCatalogRepo) QueryFormByDomainID(ctx context.Context, domainIDSlice ...string) (ds []*model.TBusinessFormNotCataloged, err error) {
	err = repo.db.WithContext(ctx).Where("f_business_domain_id in ? ", domainIDSlice).Find(&ds).Error
	if err != nil {
		return ds, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return ds, err
}
