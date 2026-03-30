package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_privacy_policy"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type dataPrivacyPolicyRepo struct {
	db *gorm.DB
}

func NewDataPrivacyPolicyRepo(db *gorm.DB) data_privacy_policy.DataPrivacyPolicyRepo {
	return &dataPrivacyPolicyRepo{db: db}
}

func (r *dataPrivacyPolicyRepo) Db() *gorm.DB {
	return r.db
}

func (r *dataPrivacyPolicyRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.DataPrivacyPolicy, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var policy model.DataPrivacyPolicy
	err := db.Where("id = ?", id).Where("deleted_at = 0").First(&policy).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &policy, nil
}

func (r *dataPrivacyPolicyRepo) GetByFormViewId(ctx context.Context, formViewId string, tx ...*gorm.DB) (*model.DataPrivacyPolicy, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var policy model.DataPrivacyPolicy
	err := db.Where("form_view_id = ?", formViewId).Where("deleted_at = 0").First(&policy).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &policy, nil
}

func (r *dataPrivacyPolicyRepo) PageList(ctx context.Context, req *domain.PageListDataPrivacyPolicyReq) (total int64, data_privacy_policy []*model.DataPrivacyPolicy, err error) {
	var typeName string
	if req.DatasourceId != "" {
		if err = r.db.WithContext(ctx).Select("type_name").Table(model.TableNameDatasource).Where("id =?", req.DatasourceId).Take(&typeName).Error; err != nil {
			log.WithContext(ctx).Error("formViewRepo GetById DatabaseError", zap.Error(err))
		}
	}

	var db *gorm.DB
	db = r.db.WithContext(ctx).Table("data_privacy_policy dpp").Where("dpp.deleted_at=0") //deleted_at=0   for count without deleted_at

	if req.DatasourceId != "" || req.SubjectID != "" || req.DepartmentID != "" || req.Sort == "name" || req.Keyword != "" {
		db = db.Joins("INNER JOIN form_view f  ON dpp.form_view_id = f.id")
	}

	if req.DatasourceId != "" {
		db = db.Where("f.datasource_id = ?", req.DatasourceId)
	}

	if req.SubjectID == constant.UnallocatedId {
		db = db.Where("f.subject_id is null  or f.subject_id =''")
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId && req.IncludeSubSubject {
		db = db.Where("f.subject_id in ?", req.SubSubSubjectIDs)
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId && !req.IncludeSubSubject {
		db = db.Where("f.subject_id = ?", req.SubjectID)
	}

	if req.DepartmentID == constant.UnallocatedId {
		db = db.Where("f.department_id is null or f.department_id =''")
	}
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId && req.IncludeSubDepartment {
		db = db.Where("f.department_id in ?", req.SubDepartmentIDs)
	}
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId && !req.IncludeSubDepartment {
		db = db.Where("f.department_id = ?", req.DepartmentID)
	}

	keyword := req.Keyword
	if keyword != "" {
		keyword = strings.Replace(keyword, "_", "\\_", -1)
		keyword = "%" + keyword + "%"
		db = db.Where("f.technical_name like ? or f.business_name like ? or f.uniform_catalog_code like ?", keyword, keyword, keyword)
	}
	err = db.Count(&total).Error
	if err != nil {
		return total, data_privacy_policy, err
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" f.business_name %s", req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	}
	err = db.Find(&data_privacy_policy).Error
	return total, data_privacy_policy, err
}

func (r *dataPrivacyPolicyRepo) Create(ctx context.Context, policy *model.DataPrivacyPolicy) (id string, err error) {
	err = r.db.WithContext(ctx).Create(policy).Error
	if err != nil {
		return "", err
	}
	return policy.ID, nil
}

func (r *dataPrivacyPolicyRepo) Update(ctx context.Context, policy *model.DataPrivacyPolicy) error {
	return r.db.WithContext(ctx).Where("id = ?", policy.ID).Where("deleted_at = 0").Updates(policy).Error
}

func (r *dataPrivacyPolicyRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&model.DataPrivacyPolicy{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *dataPrivacyPolicyRepo) IsExistByFormViewId(ctx context.Context, formViewId string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.DataPrivacyPolicy{}).
		Where("form_view_id = ?", formViewId).
		Where("deleted_at = 0").
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *dataPrivacyPolicyRepo) GetFormViewIdsByFormViewIds(ctx context.Context, formViewIds []string) ([]string, error) {
	err := r.db.WithContext(ctx).
		Model(&model.DataPrivacyPolicy{}).
		Where("form_view_id in ?", formViewIds).
		Where("deleted_at = 0").
		Pluck("form_view_id", &formViewIds).Error
	if err != nil {
		return nil, err
	}
	return formViewIds, nil
}
